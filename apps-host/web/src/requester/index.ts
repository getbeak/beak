import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import type {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequestPayload,
} from '@beak/common/types/requester';
import type { RequestBodyFile, RequestOverview } from '@getbeak/types/request';

// Matches the renderer-side `requestAllowsBody` and the Node requester.
// RFC 9110 only strips bodies on GET/HEAD/OPTIONS — DELETE keeps its body.
const bodyFreeVerbs = ['get', 'head', 'options'];

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
	const { flightId, request } = payload;
	const start = Date.now();

	heartbeat({
		flightId,
		stage: 'fetch_response',
		payload: { timestamp: start },
	});

	let response: Response;

	try {
		response = await runRequest(request);
	} catch (error) {
		failed({ flightId, error: error as Error });

		return;
	}

	const contentLengthUnstable = response.headers.get('content-length') ?? '0';
	const contentLength = Number.parseInt(contentLengthUnstable, 10) || 0;

	let hasBody = contentLength > 0;

	heartbeat({
		flightId,
		stage: 'parsing_response',
		payload: { contentLength, timestamp: Date.now() },
	});

	if (response.bodyUsed) {
		failed({ flightId, error: new Error('body already used') });

		return;
	}

	if (response.body !== null) {
		const reader = response.body.getReader();

		// Read to completion before signalling complete — the previous
		// fire-and-forget `reader.read().then(...)` chain returned immediately
		// and `complete()` ran with zero body chunks delivered.
		while (true) {
			const { done, value } = await reader.read();
			if (value) {
				hasBody = true;
				heartbeat({
					flightId,
					stage: 'reading_body',
					payload: { buffer: value, timestamp: Date.now() },
				});
			}
			if (done) break;
		}
	}

	complete({
		flightId,
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

async function runRequest(overview: RequestOverview) {
	const { body, headers, verb } = overview;
	const url = overview.url[0];

	const init: RequestInit = {
		method: verb,
		headers: TypedObject.values(headers)
			.filter(h => h.enabled)
			.reduce(
				(acc, val) => ({
					...acc,
					[val.name]: val.value[0],
				}),
				{},
			),
		redirect: 'manual',
	};

	if (!bodyFreeVerbs.includes(verb.toLowerCase())) {
		switch (body.type) {
			case 'text':
				init.body = body.payload as string;
				break;

			case 'file':
				init.body = (body as RequestBodyFile).payload.__hacky__binaryFileData! as BlobPart as BodyInit;
				break;

			default:
				throw new Error(`Unknown body type ${body.type}`);
		}

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

	for (const [key, value] of entries) headers[key] = value;

	return headers;
}
