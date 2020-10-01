import { RequestOverview } from '@beak/common/src/beak-project/types';
import { constructUri } from '@beak/common/src/beak-project/url';
import { calculatePercentage } from '@beak/common/src/helpers/number';
import { TypedObject } from '@beak/common/src/helpers/typescript';
import {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
} from '@beak/common/src/requester/types';
import { call, put, select } from 'redux-saga/effects';
import { PayloadAction } from 'typesafe-actions';

import { ApplicationState } from '../..';
import * as actions from '../actions';
import { RequestFlightPayload, State } from '../types';

const electron = window.require('electron');
const { ipcRenderer } = electron;

export default function* requestFlightWorker({ payload }: PayloadAction<string, RequestFlightPayload>) {
	const { flightId, requestId, info } = payload;
	const flight: State = yield select((s: ApplicationState) => s.global.flight);

	if (flight.currentFlight?.flighting) {
		yield put(actions.cancelFlightRequest(flightId));

		return;
	}

	yield put(actions.beginFlightRequest({ flightId, requestId, info }));

	// TODO(afr): Remove these listeners when flight over
	ipcRenderer.on(`flight_heartbeat:${flightId}`, (_, payload: FlightHeartbeatPayload) => {
		console.log(payload);
	});

	ipcRenderer.on(`flight_complete:${flightId}`, (_, payload: FlightCompletePayload) => {
		console.log(payload);

		// yield put(actions.completeFlight({
		// 	flightId,
		// 	requestId,
		// 	info,
		// 	response: {
		// 		...response,
		// 		length: diff,
		// 	},
		// }));
	});

	ipcRenderer.on(`flight_failed:${flightId}`, (_, payload: FlightFailedPayload) => {
		console.log(payload);
	});

	ipcRenderer.invoke('flight_request', payload);
}

export function* requestFlightWorkerOld({ payload }: PayloadAction<string, RequestFlightPayload>) {
	const { flightId, requestId, info } = payload;
	const flight: State = yield select((s: ApplicationState) => s.global.flight);

	if (flight.currentFlight?.flighting) {
		yield put(actions.cancelFlightRequest(flightId));

		return;
	}

	yield put(actions.beginFlightRequest({ flightId, requestId, info }));

	// TODO(afr): Move this logic out (maybe to go lib) for better control + no CORS bs

	const start = Date.now();
	let fetchResponse: Response;

	try {
		fetchResponse = yield call(runRequest, info);
	} catch (error) {
		console.error(error);

		throw error;
	}

	const reader = fetchResponse.body?.getReader();

	const response = {
		statusCode: fetchResponse.status,
		redirected: fetchResponse.redirected,
		headers: headersToObject(fetchResponse.headers.entries()),
	};

	const end = Date.now();
	const diff = end - start;
}

async function runRequest(info: RequestOverview) {
	const { headers, uri } = info;
	const url = constructUri(info);

	const options: RequestInit = {
		method: uri.verb,
		headers: TypedObject.values(headers)
			.filter(h => h.enabled)
			.reduce((acc, val) => ({
				...acc,
				[val.name]: val.value,
			}), {}),
		mode: 'no-cors',
		credentials: 'omit',
		cache: 'no-cache',
		redirect: 'follow',
		referrer: '',
		referrerPolicy: 'no-referrer',
	};

	return await fetch(url, options);
}

function headersToObject(entries: IterableIterator<[string, string]>) {
	const headers: Record<string, string> = {};
	let result = entries.next();

	while (!result.done) {
		const [key, value] = result.value;

		headers[key] = value;

		result = entries.next();
	}

	return headers;
}
