import binaryStore from '@beak/app/lib/binary-store';
import { RequestNode } from '@beak/common/dist/types/beak-project';
import {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
} from '@beak/common/types/requester';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import { END, eventChannel } from 'redux-saga';
import { put, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import * as actions from '../actions';
import { State } from '../types';

const electron = window.require('electron');
const { ipcRenderer } = electron;

export default function* requestFlightWorker() {
	const binaryStoreKey = ksuid.generate('binstore').toString();
	const requestId: string = yield select((s: ApplicationState) => s.global.project.selectedRequest);
	const flightId = ksuid.generate('flight').toString();

	const flight: State = yield select((s: ApplicationState) => s.global.flight);
	const node: RequestNode = yield select((s: ApplicationState) => s.global.project.tree![requestId]);

	if (flight.currentFlight?.flighting) {
		// TODO(afr): Ask user if they want to cancel existing, or cancel new

		return;
	}

	binaryStore.create(binaryStoreKey);

	yield put(actions.beginFlightRequest({
		binaryStoreKey,
		requestId,
		flightId,
		request: node.info,
	}));

	const channel = eventChannel(emitter => {
		// TODO(afr): Remove these listeners when flight over

		ipcRenderer.on(`flight_heartbeat:${flightId}`, (_, payload: FlightHeartbeatPayload) => {
			if (payload.stage === 'reading_body')
				binaryStore.append(binaryStoreKey, payload.payload.buffer);

			emitter(actions.updateFlightProgress(payload));
		});

		ipcRenderer.on(`flight_complete:${flightId}`, (_, payload: FlightCompletePayload) => {
			emitter(actions.completeFlight({ flightId, requestId, response: payload.overview }));
			emitter(END);
		});

		ipcRenderer.on(`flight_failed:${flightId}`, (_, payload: FlightFailedPayload) => {
			emitter(actions.flightFailure({ flightId, requestId, error: payload.error }));
			emitter(END);
		});

		return () => { /* */ };
	});

	ipcRenderer.send('flight_request', {
		flightId,
		requestId,
		request: node.info,
	});

	while (true) {
		const result = yield take(channel);

		if (result === null)
			break;

		yield put(result);
	}
}
