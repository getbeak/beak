import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import { FlightMessages } from '@beak/common/ipc/flight';
import type { NotificationPreferences } from '@beak/common/types/preferences';
import {
	type BeginFlightPayload,
	beginFlightRequest,
	completeFlight,
	type FlightRequest,
	flightFailure,
	requestFlight,
	requestPureFlight,
	updateFlightProgress,
} from '@beak/core/flight';
import ksuid from '@beak/ksuid';
import { instance as windowSessionInstance } from '@beak/ui/contexts/window-session-context';
import { convertKeyValueToString } from '@beak/ui/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/ui/features/json-editor/parsers';
import { parseValueSections } from '@beak/ui/features/variables/parser';
import binaryStore from '@beak/ui/lib/binary-store';
import {
	ipcDialogService,
	ipcFlightService,
	ipcFsService,
	ipcNotificationService,
	ipcPreferencesService,
} from '@beak/ui/lib/ipc';
import { requestAllowsBody } from '@beak/ui/utils/http';
import { convertRequestToUrl } from '@beak/ui/utils/uri';
import type { RequestNode, ValidRequestNode } from '@getbeak/types/nodes';
import type { ResponseOverview } from '@getbeak/types/response';
import type { Context } from '@getbeak/types/values';

import { type PrepareRequestDeps, prepareRequest } from '../../services/flight/prepare-request';
import { getStatusReasonPhrase } from '../../utils/http';
import type { AppStartListening } from '../listener';

function buildPrepareDeps(): PrepareRequestDeps {
	return {
		parseValueSections,
		convertRequestToUrl,
		convertToRealJson,
		convertKeyValueToString,
		readReferencedFile: id => ipcFsService.readReferencedFile(id),
		requestAllowsBody,
		requestBodyContentType,
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
				// eslint-disable-next-line no-console
				console.error('Node not found for flight request', requestId);
				return;
			}

			const activeFlight = api.getState().global.flight.activeFlights[requestId];
			if (activeFlight) {
				await ipcDialogService.showMessageBox({
					title: 'Request already in flight',
					message:
						"You already have a request currently in flight. You won't be able to run a new request until it has finished.",
					type: 'warning',
				});
				return;
			}

			const state = api.getState();
			const context: Context = {
				selectedSets: state.global.preferences.editor.selectedVariableSets,
				variableGroups: state.global.variableGroups.variableGroups,
				flightHistories: state.global.flight.flightHistories,
				projectTree: state.global.project.tree,
				currentRequestId: requestId,
			};

			const preparedRequest = await prepareRequest(node.info, context, buildPrepareDeps());

			api.dispatch(
				beginFlightRequest({
					binaryStoreKey,
					requestId,
					flightId,
					request: preparedRequest,
					redirectDepth: 0,
					reason: 'request_editor',
					showProgress: true,
					showResult: true,
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
						error: new Error(`Max redirect depth hit ${redirectDepth}`),
					}),
				);
				return;
			}

			let response: ResponseOverview | null = null;
			let error: Error | null = null;

			const settled = new Promise<void>(resolve => {
				ipcFlightService.registerFlightHeartbeat(async (_event, heartbeat) => {
					if (heartbeat.stage === 'reading_body') binaryStore.append(binaryStoreKey, heartbeat.payload.buffer);
					api.dispatch(updateFlightProgress({ requestId, flightId, heartbeat }));
				});
				ipcFlightService.registerFlightComplete(async (_event, completePayload) => {
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
				});
				ipcFlightService.registerFlightFailed(async (_event, failedPayload) => {
					error = failedPayload.error;
					api.dispatch(flightFailure({ flightId, requestId, error: failedPayload.error }));
					resolve();
				});
			});

			ipcFlightService.startFlight({ flightId, requestId, request });

			try {
				await settled;
			} finally {
				ipcFlightService.unregister(FlightMessages.FlightHeartbeat);
				ipcFlightService.unregister(FlightMessages.FlightComplete);
				ipcFlightService.unregister(FlightMessages.FlightFailed);

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
