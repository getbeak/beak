import binaryStore from '@beak/app/lib/binary-store';
import { ipcFlightService, ipcNotificationService } from '@beak/app/lib/ipc';
import { getStatusReasonPhrase } from '@beak/app/utils/http';
import {
	RequestNode,
	RequestOverview,
	ResponseOverview,
} from '@beak/common/dist/types/beak-project';
import { TypedObject } from '@beak/common/helpers/typescript';
import { FlightMessages } from '@beak/common/ipc/flight';
import { statusToColour } from '@beak/design-system/helpers';
import ksuid from '@cuvva/ksuid';
import { PayloadAction } from '@reduxjs/toolkit';
import { END, eventChannel } from 'redux-saga';
import { put, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import * as actions from '../actions';
import { BeginFlightPayload } from '../types';

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

			emitter(actions.completeFlight({ flightId, requestId, response: payload.overview }));
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
		switch (true) {
			case Boolean(error): {
				ipcNotificationService.sendNotification({
					title: 'Request failed',
					body: `${requestNode.name} failed in transit`,
				});

				break;
			}

			case Boolean(response): {
				const redirected: boolean = yield detectAndHandleRedirect(request, response!, redirectDepth, requestId);

				if (redirected)
					break;

				ipcNotificationService.sendNotification({
					title: `${requestNode.name} - ${response!.status} ${getStatusReasonPhrase(response!.status)}`,
					body: request.url[0] as string,
				});

				break;
			}

			default: break;
		}
	}
}

function* detectAndHandleRedirect(request: RequestOverview, response: ResponseOverview, depth: number, reqId: string) {
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
	const newRequest = {
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
	}));

	return true;
}
