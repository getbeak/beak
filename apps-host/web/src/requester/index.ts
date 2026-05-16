import { requestBodyContentType } from '@beak/common/helpers/request';
import { SseParser, isSseContentType } from '@beak/common/helpers/sse-parser';
import { TypedObject } from '@beak/common/helpers/typescript';
import type {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequestPayload,
	ResponseStreamKind,
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
	fetch_response   — about to fire fetch
	head_received    — fetch resolved; headers/status/url available
	reading_body     — one body chunk arrived
	sse_event        — fired when the response is text/event-stream
*/

export async function startRequester(options: RequesterOptions) {
	const { payload, callbacks } = options;
	const { complete, failed, heartbeat } = callbacks;
	const { flightId, request } = payload;
	const start = Date.now();

	heartbeat({ flightId, stage: 'fetch_response', payload: { timestamp: start } });

	let response: Response;
	try {
		response = await runRequest(request);
	} catch (error) {
		failed({ flightId, error: error as Error });
		return;
	}

	const headers = headersToObject(response.headers);
	const contentType = response.headers.get('content-type');
	const contentLength = Number.parseInt(response.headers.get('content-length') ?? '0', 10) || 0;
	const streamKind = classifyStream(contentType, response.headers.get('transfer-encoding'));

	heartbeat({
		flightId,
		stage: 'head_received',
		payload: {
			timestamp: Date.now(),
			status: response.status,
			headers,
			url: response.url,
			redirected: response.redirected,
			contentType,
			contentLength,
			streamKind,
		},
	});

	if (response.bodyUsed) {
		failed({ flightId, error: new Error('body already used') });
		return;
	}

	let hasBody = contentLength > 0;
	const sseParser = streamKind === 'sse' ? new SseParser() : null;

	if (response.body !== null) {
		const reader = response.body.getReader();

		// Read to completion before signalling complete — the previous
		// fire-and-forget `reader.read().then(...)` chain returned immediately
		// and `complete()` ran with zero body chunks delivered.
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (value) {
					hasBody = true;
					heartbeat({ flightId, stage: 'reading_body', payload: { buffer: value, timestamp: Date.now() } });

					if (sseParser) {
						for (const event of sseParser.push(value)) {
							heartbeat({ flightId, stage: 'sse_event', payload: { timestamp: Date.now(), event } });
						}
					}
				}
				if (done) break;
			}
		} catch (error) {
			failed({ flightId, error: error as Error });
			return;
		}

		if (sseParser) {
			for (const event of sseParser.flush()) {
				heartbeat({ flightId, stage: 'sse_event', payload: { timestamp: Date.now(), event } });
			}
		}
	}

	complete({
		flightId,
		timestamp: Date.now(),
		overview: { headers, redirected: response.redirected, status: response.status, url: response.url, hasBody },
	});
}

function classifyStream(contentType: string | null, transferEncoding: string | null): ResponseStreamKind {
	if (isSseContentType(contentType)) return 'sse';
	if (transferEncoding && transferEncoding.toLowerCase().includes('chunked')) return 'chunked';
	return 'standard';
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
			// `Partial` map — `requestBodyContentType` can now return undefined
			// for body types Beak doesn't auto-assign a Content-Type to
			// (json_raw, grpc). In that case the user's explicit headers win,
			// which is exactly the behaviour those types want.
			if (contentType) (init.headers as Record<string, string>)['Content-Type'] = contentType;
		}
	}

	return await fetch(url.toString(), init);
}

function headersToObject(entries: Iterable<[string, string]>) {
	const headers: Record<string, string> = {};

	for (const [key, value] of entries) headers[key] = value;

	return headers;
}
