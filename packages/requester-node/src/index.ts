import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import { convertRequestToUrl } from '@beak/common/helpers/uri';
import { parsePartsValue } from '@beak/common/src/helpers/variable-groups';
import { RequestOverview, VariableGroups } from '@beak/common/types/beak-project';
import {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequestPayload,
} from '@beak/common/types/requester';
import fetch, { RequestInit, Response } from 'node-fetch';

const bodyFreeVerbs = ['get', 'head'];

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
	00%-025%: fetch response
	25%-026%: parsing response
	27%-100%: reading response body
*/

export async function startRequester(options: RequesterOptions) {
	const { payload, callbacks } = options;
	const { complete, failed, heartbeat } = callbacks;
	const { request, selectedGroups, variableGroups } = payload;
	const start = Date.now();

	heartbeat({
		stage: 'fetch_response',
		payload: { timestamp: start },
	});

	let response: Response;

	try {
		response = await runRequest(selectedGroups, variableGroups, request);
	} catch (error) {
		failed({ error });

		return;
	}

	const contentLengthUnstable = response.headers.get('content-length') ?? '0';
	const contentLength = Number.parseInt(contentLengthUnstable, 10) || 0;

	let hasBody = contentLength > 0;

	heartbeat({
		stage: 'parsing_response',
		payload: { contentLength, timestamp: Date.now() },
	});

	if (response.bodyUsed) {
		failed({ error: new Error('body already used') });

		return;
	}

	for await (const chunk of response.body) {
		hasBody = true;

		heartbeat({
			stage: 'reading_body',
			payload: { buffer: chunk as Buffer, timestamp: Date.now() },
		});
	}

	complete({
		timestamp: Date.now(),
		overview: {
			headers: headersToObject(response.headers),
			redirected: response.redirected,
			status: response.status,
			url: response.url,
			hasBody,
		},
	});
}

async function runRequest(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	overview: RequestOverview,
) {
	const { body, headers, verb } = overview;
	const url = convertRequestToUrl(selectedGroups, variableGroups, overview);

	const init: RequestInit = {
		method: verb,
		headers: TypedObject.values(headers)
			.filter(h => h.enabled)
			.reduce((acc, val) => ({
				...acc,
				[val.name]: parsePartsValue(selectedGroups, variableGroups, val.value),
			}), {}),
		redirect: 'follow',
		compress: false,
	};

	if (!bodyFreeVerbs.includes(verb)) {
		if (['text', 'json'].includes(body.type))
			init.body = body.payload as string;

		const hasContentTypeHeader = TypedObject.keys(headers)
			.map(h => h.toLocaleLowerCase())
			.find(h => h === 'content-type');

		if (!hasContentTypeHeader && body.type !== 'text') {
			const contentType = requestBodyContentType(body);

			(init.headers as Record<string, string>)['Content-Type'] = contentType;
		}
	}

	return await fetch(url.toString(), init);
}

function headersToObject(entries: Iterable<[string, string]>) {
	const headers: Record<string, string> = {};

	for (const [key, value] of entries)
		headers[key] = value;

	return headers;
}
