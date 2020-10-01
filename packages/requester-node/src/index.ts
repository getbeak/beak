import { RequestOverview } from '@beak/common/src/beak-project/types';
import { constructUri } from '@beak/common/src/beak-project/url';
import { TypedObject } from '@beak/common/src/helpers/typescript';
import {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequestPayload,
} from '@beak/common/src/requester/types';
import fetch, { RequestInit, Response } from 'node-fetch';

export interface RequesterOptions {
	payload: FlightRequestPayload;
	callbacks: {
		heartbeat: (payload: FlightHeartbeatPayload) => void;
		complete: (payload: FlightCompletePayload) => void;
		failed: (payload: FlightFailedPayload) => void;
	};
}

/*
Stages:
00%-25%: fetch response
25%-26%: parsing response
27%-100%: reading response body
*/

export async function startRequester(options: RequesterOptions) {
	const { payload, callbacks } = options;
	const { complete, failed, heartbeat } = callbacks;
	const { requestOverview } = payload;
	const start = Date.now();

	heartbeat({
		stage: 'fetch_response',
		payload: { timestamp: start },
	});

	let response: Response;

	try {
		response = await runRequest(requestOverview);
	} catch (error) {
		failed(error);

		return;
	}

	const contentLengthUnstable = response.headers.get('content-length') ?? '0';
	const contentLength = Number.parseInt(contentLengthUnstable, 10) || 0;

	heartbeat({
		stage: 'parsing_response',
		payload: { contentLength },
	});

	if (contentLength > 0) {
		if (response.bodyUsed) {
			failed({ error: new Error('body already used') });

			return;
		}

		while (response.body.readable) {
			const result = response.body.read(0xFF) as Buffer | null;

			heartbeat({
				stage: 'reading_body',
				payload: { buffer: result },
			});
		}
	}

	complete({ timestamp: Date.now() }); // TODO(afr): Send response here too
}

async function runRequest(overview: RequestOverview) {
	const { headers, uri } = overview;
	const url = constructUri(overview);

	const init: RequestInit = {
		method: uri.verb,
		headers: TypedObject.values(headers)
			.filter(h => h.enabled)
			.reduce((acc, val) => ({
				...acc,
				[val.name]: val.value,
			}), {}),
		redirect: 'follow',
		compress: false,
	};

	return await fetch(url, init);
}
