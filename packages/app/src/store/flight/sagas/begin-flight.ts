import binaryStore from '@beak/app/lib/binary-store';
import { ipcFlightService } from '@beak/app/lib/ipc';
import {
	RequestOverview,
	ResponseOverview,
} from '@beak/common/dist/types/beak-project';
import { TypedObject } from '@beak/common/helpers/typescript';
import { FlightMessages } from '@beak/common/ipc/flight';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import { PayloadAction } from '@reduxjs/toolkit';
import { END, eventChannel } from 'redux-saga';
import { put, take } from 'redux-saga/effects';

import * as actions from '../actions';
import { BeginFlightPayload } from '../types';

export default function* requestFlightWorker({ payload }: PayloadAction<BeginFlightPayload>) {
	const { binaryStoreKey, flightId, request, requestId, redirectDepth } = payload;

	if (redirectDepth >= 10) {
		yield put(actions.flightFailure({
			flightId,
			requestId,
			error: new Error(`Max redirect depth hit ${redirectDepth}`),
		}));

		return;
	}

	let response: ResponseOverview | null = null;

	const channel = eventChannel(emitter => {
		ipcFlightService.registerFlightHeartbeat((_event, payload) => {
			if (payload.stage === 'reading_body')
				binaryStore.append(binaryStoreKey, payload.payload.buffer);

			emitter(actions.updateFlightProgress(payload));
		});

		ipcFlightService.registerFlightComplete((_event, payload) => {
			response = payload.overview;

			emitter(actions.completeFlight({ flightId, requestId, response: payload.overview }));
			emitter(END);
		});

		ipcFlightService.registerFlightFailed((_event, payload) => {
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
			const result = yield take(channel);

			yield put(result);
		}
	} finally {
		if (response)
			yield detectAndHandleRedirect(request, response, redirectDepth, requestId);
	}
}

function* detectAndHandleRedirect(request: RequestOverview, response: ResponseOverview, depth: number, reqId: string) {
	const withinRedirectRange = response.status >= 300 && response.status < 400;

	if (!withinRedirectRange || !request.options.followRedirects)
		return;

	const url = new URL(request.url[0] as string); // hack
	const locationHeader = TypedObject.keys(response.headers).find(h => h.toLowerCase() === 'location');
	const location = response.headers[locationHeader ?? ''];

	if (!location)
		return;

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
}
