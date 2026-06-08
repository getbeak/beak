import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import type { NotificationPreferences } from '@beak/common/types/preferences';
import type { FlightCompletePayload, FlightFailedPayload, FlightHeartbeatPayload } from '@beak/common/types/requester';
import ksuid from '@beak/ksuid';
import {
	type BeginFlightPayload,
	beginFlightRequest,
	completeFlight,
	type FlightRequest,
	flightFailure,
	requestFlight,
	requestPureFlight,
	updateFlightProgress,
} from '@beak/state/flight';
import { resolveLegacyWithValues } from '@beak/state/request-values';
import { instance as windowSessionInstance } from '@beak/ui/contexts/window-session-context';
import { convertKeyValueToString } from '@beak/ui/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/ui/features/json-editor/parsers';
import { parseValueSections } from '@beak/ui/features/variables/parser';
import { resolveValueSections } from '@beak/ui/features/variables/resolver';
import binaryStore from '@beak/ui/lib/binary-store';
import { ipcFlightService, ipcFsService, ipcNotificationService, ipcPreferencesService } from '@beak/ui/lib/ipc';
import { streamRegistry } from '@beak/ui/services/streams/registry';
import { convertRequestToUrl } from '@beak/ui/services/url';
import { makeVariableContext } from '@beak/ui/services/variables/context';
import { requestAllowsBody } from '@beak/ui/utils/http';
import type { RequestNode, ValidRequestNode } from '@getbeak/types/nodes';
import type { ResponseOverview } from '@getbeak/types/response';
import type { Context } from '@getbeak/types/values';

import { attachCookiesToFlightRequest } from '../../services/flight/attach-cookies';
import { type PrepareRequestDeps, prepareRequest } from '../../services/flight/prepare-request';
import { getStatusReasonPhrase } from '../../utils/http';
import type { AppStartListening } from '../listener';

/**
 * Concurrent flights all share three IPC channels (heartbeat / complete /
 * failed). `IpcServiceRenderer.registerListener` stores one handler per
 * channel, so a per-flight register-then-unregister loop would either
 * trample a sibling flight's handler or unregister it mid-stream when the
 * first flight settled. Instead we install a single permanent listener at
 * boot and route each event to the owning flight by `payload.flightId`.
 */
interface FlightCallbacks {
	onHeartbeat: (payload: FlightHeartbeatPayload) => void;
	onComplete: (payload: FlightCompletePayload) => void;
	onFailed: (payload: FlightFailedPayload) => void;
}
const pendingFlights = new Map<string, FlightCallbacks>();
let flightListenersInstalled = false;

function ensureFlightListenersInstalled() {
	if (flightListenersInstalled) return;
	flightListenersInstalled = true;
	ipcFlightService.registerFlightHeartbeat(async (_event, payload) => {
		pendingFlights.get(payload.flightId)?.onHeartbeat(payload);
	});
	ipcFlightService.registerFlightComplete(async (_event, payload) => {
		const handler = pendingFlights.get(payload.flightId);
		if (!handler) return;
		pendingFlights.delete(payload.flightId);
		handler.onComplete(payload);
	});
	ipcFlightService.registerFlightFailed(async (_event, payload) => {
		const handler = pendingFlights.get(payload.flightId);
		if (!handler) return;
		pendingFlights.delete(payload.flightId);
		handler.onFailed(payload);
	});
}

function buildPrepareDeps(): PrepareRequestDeps {
	return {
		parseValueSections,
		resolveValueSections,
		convertRequestToUrl,
		convertToRealJson,
		convertKeyValueToString,
		readReferencedFile: id => ipcFsService.readReferencedFile(id),
		requestAllowsBody,
		requestBodyContentType,
		generateBoundary: () => `beak-${ksuid.generate('multipart').toString()}`,
		registerStream: (stream, size, contentType) => {
			const streamId = ksuid.generate('stream').toString();
			streamRegistry.register(streamId, { stream, size, contentType });
			return streamId;
		},
		userAgent: `Beak/${windowSessionInstance.version ?? ''} (${windowSessionInstance.os})`,
		generateId: kind => ksuid.generate(kind).toString(),
	};
}

export function registerFlightEffects(start: AppStartListening) {
	// requestFlight: resolve the current tab, prepare the request, dispatch begin.
	start({
		actionCreator: requestFlight,
		effect: async (_action, api) => {
			const binaryStoreKey = ksuid.generate('binstore').toString();
			const requestId = api.getState().features.tabs.selectedTab;
			if (!requestId) return;

			const flightId = ksuid.generate('flight').toString();
			const node = api.getState().global.project.tree[requestId] as ValidRequestNode | undefined;
			if (!node) {
				console.error('Node not found for flight request', requestId);
				return;
			}

			// Concurrent flights are allowed — across different requests and even the same request.
			// The slice now keys activeFlights by flightId, so a second concurrent flight does not
			// overwrite the first; both progress independently and both record history entries.

			const state = api.getState();
			const context: Context = makeVariableContext(state, requestId);

			// Overlay the values slice onto the legacy tree so flight prep sees
			// any value-mode edits that bypassed the tree reducers. Today the
			// slice mirrors the tree (backfilled on project open), so this is a
			// no-op; future phases route editor writes through the slice and
			// the overlay becomes load-bearing without prepare-request needing
			// to know which side won.
			const sliceValues = state.global.requestValues.requests[requestId] ?? null;
			const resolvedInfo = resolveLegacyWithValues(node.info, sliceValues);
			const preparedRequest = await prepareRequest(resolvedInfo, context, buildPrepareDeps());
			const requestWithCookies = attachCookiesToFlightRequest(api.getState(), preparedRequest, requestId);

			api.dispatch(
				beginFlightRequest({
					binaryStoreKey,
					requestId,
					flightId,
					request: requestWithCookies,
					redirectDepth: 0,
					reason: 'request_editor',
					showProgress: true,
					showResult: true,
					timestamp: Date.now(),
				}),
			);
		},
	});

	// requestPureFlight: like requestFlight but the request is supplied by the caller.
	start({
		actionCreator: requestPureFlight,
		effect: async ({ payload }, api) => {
			const binaryStoreKey = ksuid.generate('binstore').toString();
			const flightId = payload.flightId ?? ksuid.generate('flight').toString();

			const node = api.getState().global.project.tree[payload.referenceRequestId] as ValidRequestNode | undefined;
			if (!node) return;

			api.dispatch(
				beginFlightRequest({
					binaryStoreKey,
					requestId: payload.referenceRequestId,
					flightId,
					request: payload.request,
					redirectDepth: 0,
					reason: payload.reason,
					showProgress: Boolean(payload.showProgress),
					showResult: typeof payload.showResult === 'string' ? payload.showResult : Boolean(payload.showResult),
					timestamp: Date.now(),
				}),
			);
		},
	});

	// beginFlightRequest: wire IPC subscriptions, call startFlight, await complete/fail.
	start({
		actionCreator: beginFlightRequest,
		effect: async ({ payload }, api) => {
			const { binaryStoreKey, flightId, request, requestId, redirectDepth } = payload;
			const requestNode = api.getState().global.project.tree[requestId] as RequestNode | undefined;

			binaryStore.create(binaryStoreKey);

			if (redirectDepth >= 10) {
				api.dispatch(
					flightFailure({
						flightId,
						requestId,
						error: { message: `Max redirect depth hit ${redirectDepth}` },
						timestamp: Date.now(),
					}),
				);
				return;
			}

			let response: ResponseOverview | null = null;
			let error: Error | null = null;

			ensureFlightListenersInstalled();

			const settled = new Promise<void>(resolve => {
				pendingFlights.set(flightId, {
					onHeartbeat: heartbeat => {
						if (heartbeat.stage === 'reading_body') binaryStore.append(binaryStoreKey, heartbeat.payload.buffer);
						api.dispatch(updateFlightProgress({ requestId, flightId, heartbeat }));
					},
					onComplete: completePayload => {
						response = completePayload.overview;
						api.dispatch(
							completeFlight({
								flightId,
								requestId,
								response: completePayload.overview,
								timestamp: completePayload.timestamp,
							}),
						);
						resolve();
					},
					onFailed: failedPayload => {
						error = failedPayload.error;
						api.dispatch(
							flightFailure({
								flightId,
								requestId,
								error: { message: failedPayload.error.message, code: (failedPayload.error as { code?: string }).code },
								timestamp: Date.now(),
							}),
						);
						resolve();
					},
				});
			});

			ipcFlightService.startFlight({
				flightId,
				requestId,
				request,
				projectFolder: api.getState().global.project.folderPath ?? undefined,
			});

			try {
				await settled;
			} finally {
				pendingFlights.delete(flightId);

				if (requestNode) {
					await notifyOutcome(requestNode, request, response, error, payload, api);
				}
			}
		},
	});
}

async function notifyOutcome(
	requestNode: RequestNode,
	request: FlightRequest,
	response: ResponseOverview | null,
	error: Error | null,
	payload: BeginFlightPayload,
	api: { dispatch: (a: { type: string; [k: string]: unknown }) => unknown },
) {
	const focused = document.hasFocus();
	const notifications = await ipcPreferencesService.getNotificationOverview();
	const shouldShowBanner = !focused || notifications.showRequestNotificationWhenFocused;

	switch (true) {
		case Boolean(error): {
			if (notifications.onFailedRequest === 'off') return;
			if (notifications.onFailedRequest === 'sound-only') {
				ipcNotificationService.notificationBeep();
				return;
			}
			if (shouldShowBanner) {
				ipcNotificationService.sendNotification({
					title: 'Request failed',
					body: `${requestNode.name} failed in transit`,
					silent: notifications.onFailedRequest === 'on-no-sound',
				});
			}
			return;
		}
		case Boolean(response): {
			const redirected = handleRedirect(payload, request, response!, payload.redirectDepth, payload.requestId, api);
			if (redirected) return;

			const preference = notifications[statusToNotification(response!.status)];
			if (preference === 'off') return;
			if (preference === 'sound-only') {
				ipcNotificationService.notificationBeep();
				return;
			}
			if (shouldShowBanner) {
				ipcNotificationService.sendNotification({
					title: `${requestNode.name} - ${response!.status} ${getStatusReasonPhrase(response!.status)}`,
					body: request.url[0] as string,
					silent: preference === 'on-no-sound',
				});
			}
		}
	}
}

function handleRedirect(
	payload: BeginFlightPayload,
	request: FlightRequest,
	response: ResponseOverview,
	depth: number,
	reqId: string,
	api: { dispatch: (a: { type: string; [k: string]: unknown }) => unknown },
): boolean {
	const withinRedirectRange = response.status >= 300 && response.status < 400;
	if (!withinRedirectRange || !request.options.followRedirects) return false;

	const url = new URL(request.url[0] as string);
	const locationHeader = TypedObject.keys(response.headers).find(h => h.toLowerCase() === 'location');
	const location = response.headers[locationHeader ?? ''];
	if (!location) return false;

	const binaryStoreKey = ksuid.generate('binstore').toString();
	const flightId = ksuid.generate('flight').toString();
	const stagingResolvedUrl = new URL(location, url);
	const resolvedUrl = stagingResolvedUrl.host === url.host ? stagingResolvedUrl.toString() : location;
	const newRequest: FlightRequest = { ...request, url: [resolvedUrl] };

	if (response.status === 303) newRequest.verb = 'GET';

	api.dispatch(
		beginFlightRequest({
			binaryStoreKey,
			flightId,
			redirectDepth: depth + 1,
			request: newRequest,
			requestId: reqId,
			reason: payload.reason,
			showProgress: payload.showProgress,
			showResult: payload.showResult,
			timestamp: Date.now(),
		}),
	);

	return true;
}

function statusToNotification(status: number): keyof NotificationPreferences {
	switch (true) {
		case status >= 100 && status < 200:
			return 'onInformationRequest';
		case status >= 200 && status < 300:
			return 'onSuccessfulRequest';
		case status >= 300 && status < 400:
			return 'onInformationRequest';
		case status >= 400 && status < 500:
			return 'onInformationRequest';
		case status >= 500 && status < 600:
			return 'onFailedRequest';
		default:
			return 'onInformationRequest';
	}
}
