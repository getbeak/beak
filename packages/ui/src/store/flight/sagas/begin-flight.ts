import { TypedObject } from '@beak/common/helpers/typescript';
import { FlightMessages } from '@beak/common/ipc/flight';
import { NotificationPreferences } from '@beak/common/types/preferences';
import ksuid from '@beak/ksuid';
import binaryStore from '@beak/ui/lib/binary-store';
import { ipcFlightService, ipcNotificationService, ipcPreferencesService } from '@beak/ui/lib/ipc';
import { getStatusReasonPhrase } from '@beak/ui/utils/http';
import type { RequestNode } from '@getbeak/types/nodes';
import type { ResponseOverview } from '@getbeak/types/response';
import { END, eventChannel } from '@redux-saga/core';
import { call, put, select, take } from '@redux-saga/core/effects';
import { PayloadAction } from '@reduxjs/toolkit';

import { ApplicationState } from '../..';
import * as actions from '../actions';
import { BeginFlightPayload, FlightRequest } from '../types';

export default function* requestFlightWorker({ payload }: PayloadAction<BeginFlightPayload>) {
	const { binaryStoreKey, flightId, request, requestId, redirectDepth } = payload;
	const requestNode: RequestNode = yield select((s: ApplicationState) => s.global.project.tree[requestId]);

	binaryStore.create(binaryStoreKey);

	if (redirectDepth >= 10) {
		yield put(actions.flightFailure({
			flightId,
			requestId,
			error: new Error(`Max redirect depth hit ${redirectDepth}`),
		}));

		return;
	}

	let response: ResponseOverview | null = null;
	let error: Error | null = null;

	const channel = eventChannel(emitter => {
		ipcFlightService.registerFlightHeartbeat(async (_event, payload) => {
			if (payload.stage === 'reading_body')
				binaryStore.append(binaryStoreKey, payload.payload.buffer);

			emitter(actions.updateFlightProgress(payload));
		});

		ipcFlightService.registerFlightComplete(async (_event, payload) => {
			response = payload.overview;

			emitter(actions.completeFlight({
				flightId,
				requestId,
				response: payload.overview,
				timestamp: payload.timestamp,
			}));
			emitter(END);
		});

		ipcFlightService.registerFlightFailed(async (_event, payload) => {
			error = payload.error;

			emitter(actions.flightFailure({ flightId, requestId, error: payload.error }));
			emitter(END);
		});

		return () => {
			ipcFlightService.unregisterListener(FlightMessages.FlightHeartbeat);
			ipcFlightService.unregisterListener(FlightMessages.FlightComplete);
			ipcFlightService.unregisterListener(FlightMessages.FlightFailed);
		};
	});

	ipcFlightService.startFlight({
		flightId,
		requestId,
		request,
	});

	try {
		while (true) {
			const result: PayloadAction = yield take(channel);

			yield put(result);
		}
	} finally {
		// This should already be done, but it's a good safety check
		ipcFlightService.unregisterListener(FlightMessages.FlightHeartbeat);
		ipcFlightService.unregisterListener(FlightMessages.FlightComplete);
		ipcFlightService.unregisterListener(FlightMessages.FlightFailed);

		const focused = document.hasFocus();
		const notifications: NotificationPreferences = yield call([
			ipcPreferencesService,
			ipcPreferencesService.getNotificationOverview,
		]);

		const shouldShowBanner = (() => {
			if (!focused)
				return true;

			return focused && notifications.showRequestNotificationWhenFocused;
		})();

		switch (true) {
			case Boolean(error): {
				if (notifications.onFailedRequest === 'off')
					break;

				if (notifications.onFailedRequest === 'sound-only') {
					ipcNotificationService.notificationBeep();

					break;
				}

				if (shouldShowBanner) {
					ipcNotificationService.sendNotification({
						title: 'Request failed',
						body: `${requestNode.name} failed in transit`,
						silent: notifications.onFailedRequest === 'on-no-sound',
					});
				}

				break;
			}

			case Boolean(response): {
				const redirected: boolean = yield detectAndHandleRedirect(
					payload,
					request,
					response!,
					redirectDepth,
					requestId,
				);

				if (redirected)
					break;

				const notificationPreference = statusToNotification(response!.status);
				const preference = notifications[notificationPreference];

				if (preference === 'off')
					break;

				if (preference === 'sound-only') {
					ipcNotificationService.notificationBeep();

					break;
				}

				if (shouldShowBanner) {
					ipcNotificationService.sendNotification({
						title: `${requestNode.name} - ${response!.status} ${getStatusReasonPhrase(response!.status)}`,
						body: request.url[0] as string,
						silent: preference === 'on-no-sound',
					});
				}

				break;
			}

			default: break;
		}
	}
}

function* detectAndHandleRedirect(
	payload: BeginFlightPayload,
	request: FlightRequest,
	response: ResponseOverview,
	depth: number,
	reqId: string,
) {
	const withinRedirectRange = response.status >= 300 && response.status < 400;

	if (!withinRedirectRange || !request.options.followRedirects)
		return false;

	const url = new URL(request.url[0] as string); // hack
	const locationHeader = TypedObject.keys(response.headers).find(h => h.toLowerCase() === 'location');
	const location = response.headers[locationHeader ?? ''];

	if (!location)
		return false;

	const binaryStoreKey = ksuid.generate('binstore').toString();
	const flightId = ksuid.generate('flight').toString();
	const stagingResolvedUrl = new URL(location, url);
	const resolvedUrl = stagingResolvedUrl.host === url.host ? stagingResolvedUrl.toString() : location;
	const newRequest: FlightRequest = {
		...request,
		url: [resolvedUrl],
	};

	if (response.status === 303)
		newRequest.verb = 'GET';

	yield put(actions.beginFlightRequest({
		binaryStoreKey,
		flightId,
		redirectDepth: depth + 1,
		request: newRequest,
		requestId: reqId,

		reason: payload.reason,
		showProgress: payload.showProgress,
		showResult: payload.showResult,
	}));

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
