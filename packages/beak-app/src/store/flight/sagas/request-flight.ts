import { call, put, select } from 'redux-saga/effects';
import { PayloadAction } from 'typesafe-actions';

import { ApplicationState } from '../..';
import { RequestInfo } from '../../../lib/project/types';
import { constructUri } from '../../../lib/project/url';
import * as actions from '../actions';
import { RequestFlightPayload, State } from '../types';

export default function* requestFlightWorker({ payload }: PayloadAction<string, RequestFlightPayload>) {
	const { flightId, requestId, info } = payload;
	const flight: State = yield select((s: ApplicationState) => s.global.flight);

	if (flight.currentFlight?.flighting) {
		yield put(actions.cancelFlightRequest(flightId));

		return;
	}

	yield put(actions.beginFlightRequest({ flightId, requestId, info }));

	// TODO(afr): Move this logic out (maybe to go lib) for better control + no CORS

	const response: Response = yield call(runRequest, info);

	// TODO(afr): Read body and update progress

	yield put(actions.completeFlight({
		flightId,
		requestId,
		info,
		responseStatus: response.status,
	}));
}

async function runRequest(info: RequestInfo) {
	const { headers, uri } = info;
	const url = constructUri(info);

	const options: RequestInit = {
		method: uri.verb,
		headers: headers.filter(h => h.enabled).reduce((acc, val) => ({
			...acc,
			[val.name]: val.value,
		}), {}),
		mode: 'cors',
		credentials: 'omit',
		cache: 'no-cache',
		redirect: 'follow',
		referrer: '',
		referrerPolicy: 'no-referrer',
	};

	return await fetch(url, options);
}
