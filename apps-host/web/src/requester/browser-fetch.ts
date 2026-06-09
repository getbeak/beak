import { isSseContentType, SseParser } from '@beak/common/helpers/sse-parser';
import { TypedObject } from '@beak/common/helpers/typescript';
import type { FlightRequest, ResponseStreamKind } from '@beak/common/types/requester';

import type { Requester, RequesterOptions } from './types';

// Matches the renderer-side `requestAllowsBody` and the Node requester.
// RFC 9110 only strips bodies on GET/HEAD/OPTIONS — DELETE keeps its body.
const bodyFreeVerbs = ['get', 'head', 'options'];

/*
Stages:
	fetch_response   — about to fire fetch
	head_received    — fetch resolved; headers/status/url available
	reading_body     — one body chunk arrived
	sse_event        — fired when the response is text/event-stream
*/

async function startRequester(options: RequesterOptions): Promise<void> {
	const { payload, signal, callbacks } = options;
	const { complete, failed, heartbeat } = callbacks;
	const { flightId, request } = payload;
	const start = Date.now();

	if (signal.aborted) {
		failed({ flightId, error: new Error('flight_cancelled') });
		return;
	}

	heartbeat({ flightId, stage: 'fetch_response', payload: { timestamp: start } });

	let response: Response;
	try {
		response = await runRequest(request, signal);
	} catch (error) {
		if (signal.aborted) {
			failed({ flightId, error: new Error('flight_cancelled') });
			return;
		}
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

async function runRequest(overview: FlightRequest, signal: AbortSignal) {
	const { body, headers, verb } = overview;
	const url = overview.url[0];

	const init: RequestInit = {
		method: verb,
		signal,
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
		const hasContentTypeHeader = TypedObject.keys(headers)
			.map(h => h.toLocaleLowerCase())
			.find(h => h === 'content-type');

		switch (body.type) {
			case 'text':
				init.body = body.payload;
				break;

			case 'file': {
				const producer = body.payload.producer;
				if (!producer) throw new Error('file body has no producer handle');
				// The web requester can't read from `_assets/` directly (no
				// fs). Asset bytes would need to be paged in via IPC; for
				// now we punt asset and stream producers — only `inline`
				// flows here. Phase 4+ wires IPC asset reads.
				if (producer.kind !== 'inline') {
					throw new Error(`web requester cannot consume ${producer.kind} producer`);
				}
				init.body = producer.bytes as BlobPart as BodyInit;
				if (!hasContentTypeHeader) {
					const contentType = producer.contentType ?? body.payload.contentType ?? 'application/octet-stream';
					(init.headers as Record<string, string>)['Content-Type'] = contentType;
				}
				break;
			}

			case 'multipart': {
				throw new Error('web requester does not yet support multipart bodies');
			}
		}
	}

	return await fetch(url.toString(), init);
}

function headersToObject(entries: Iterable<[string, string]>) {
	const headers: Record<string, string> = {};

	for (const [key, value] of entries) headers[key] = value;

	return headers;
}

export const browserFetchRequester: Requester = {
	start: startRequester,
};
