import { call, put, select } from 'redux-saga/effects';
import { PayloadAction } from 'typesafe-actions';

import { ApplicationState } from '../..';
import { calculatePercentage } from '../../../helpers/number';
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

	const start = Date.now();
	const fetchResponse: Response = yield call(runRequest, info);
	const reader = fetchResponse.body?.getReader();

	const response = {
		statusCode: fetchResponse.status,
		redirected: fetchResponse.redirected,
		headers: headersToObject(fetchResponse.headers.entries()),
	};

	if (reader) {
		const contentLength = Number.parseInt(fetchResponse.headers.get('Content-Length') ?? '0', 10);
		const contentType = fetchResponse.headers.get('Content-Type');

		let result: ReadableStreamReadResult<Uint8Array> = yield call([reader, reader.read]);
		let processedLength = 0;
		const chunks = [];

		while (!result.done) {
			const { value } = result;

			chunks.push(value);

			processedLength += value.length;
			result = yield call([reader, reader.read]);

			yield put(actions.updateFlightProgress(calculatePercentage(processedLength, contentLength, true)));
		}

		const chunksAll = new Uint8Array(processedLength);
		let position = 0;

		for (const chunk of chunks) {
			chunksAll.set(chunk, position);
			position += chunk.length;
		}

		// TODO(afr): Handle body content in some way (text only for now? temp file for binary storage?)
	}

	const end = Date.now();
	const diff = end - start;

	yield put(actions.completeFlight({
		flightId,
		requestId,
		info,
		response: {
			...response,
			length: diff,
		},
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
