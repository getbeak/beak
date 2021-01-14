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
import { State as VGState } from '../../variable-groups/types';
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
	const vgState: VGState = yield select((s: ApplicationState) => s.global.variableGroups);
	const { selectedGroups, variableGroups } = vgState;

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
		function flightHeartbeat(_: unknown, payload: FlightHeartbeatPayload) {
			if (payload.stage === 'reading_body')
				binaryStore.append(binaryStoreKey, payload.payload.buffer);

			emitter(actions.updateFlightProgress(payload));
		}

		function flightComplete(_: unknown, payload: FlightCompletePayload) {
			emitter(actions.completeFlight({ flightId, requestId, response: payload.overview }));
			emitter(END);
		}

		function flightFailed(_: unknown, payload: FlightFailedPayload) {
			emitter(actions.flightFailure({ flightId, requestId, error: payload.error }));
			emitter(END);
		}

		ipcRenderer.on(`flight_heartbeat:${flightId}`, flightHeartbeat);
		ipcRenderer.on(`flight_complete:${flightId}`, flightComplete);
		ipcRenderer.on(`flight_failed:${flightId}`, flightFailed);

		return () => {
			ipcRenderer.removeListener(`flight_heartbeat:${flightId}`, flightHeartbeat);
			ipcRenderer.removeListener(`flight_complete:${flightId}`, flightComplete);
			ipcRenderer.removeListener(`flight_failed:${flightId}`, flightFailed);
		};
	});

	ipcRenderer.send('flight_request', {
		flightId,
		requestId,
		request: node.info,

		selectedGroups,
		variableGroups,
	});

	while (true) {
		const result = yield take(channel);

		if (result === null)
			break;

		yield put(result);
	}
}
