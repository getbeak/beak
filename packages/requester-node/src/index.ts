import { requestBodyContentType } from '@beak/common/helpers/request';
import { isSseContentType, SseParser } from '@beak/common/helpers/sse-parser';
import { TypedObject } from '@beak/common/helpers/typescript';
import type {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequestPayload,
	ResponseStreamKind,
} from '@beak/common/types/requester';
import type { RequestBodyFile, RequestOverview } from '@getbeak/types/request';
import fetch, { type RequestInit, type Response } from 'node-fetch';

// Verbs that semantically don't carry a body. Matches the renderer-side
// `requestAllowsBody` so both layers agree on which verbs get a body
// stripped — historically the two diverged on DELETE (renderer dropped,
// requester also dropped) and OPTIONS (neither dropped), which is wrong
// per RFC 9110 and inconsistent. Aligning on GET/HEAD/OPTIONS.
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
	reading_body     — one body chunk arrived (raw bytes always reported, even
	                   for SSE streams, so the raw response viewer still works)
	sse_event        — only fired when content-type is text/event-stream; a
	                   parsed SSE frame
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
		try {
			for await (const chunk of response.body) {
				const buffer = chunk as Buffer;
				hasBody = true;

				heartbeat({
					flightId,
					stage: 'reading_body',
					payload: { buffer, timestamp: Date.now() },
				});

				if (sseParser) {
					for (const event of sseParser.push(buffer)) {
						heartbeat({ flightId, stage: 'sse_event', payload: { timestamp: Date.now(), event } });
					}
				}
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
	const { body, headers, verb, options } = overview;
	const url = overview.url[0];

	const followRedirects = Boolean(options?.followRedirects);
	const decompressResponse = options?.decompressResponse ?? true;
	const timeoutMs = options?.timeoutMs ?? 0;
	const maxRedirects = options?.maxRedirects ?? 5;

	const init: RequestInit & { timeout?: number; follow?: number } = {
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
		redirect: followRedirects ? 'follow' : 'manual',
		// node-fetch's `compress` flag accepts gzip/br/deflate and decodes
		// the body transparently when true. When the user opts out we leave
		// the encoded bytes alone so they can inspect raw payloads.
		compress: decompressResponse,
		timeout: timeoutMs > 0 ? timeoutMs : 0,
		follow: maxRedirects,
	};

	if (!bodyFreeVerbs.includes(verb.toLowerCase())) {
		switch (body.type) {
			case 'text':
			case 'json_raw':
				init.body = body.payload as string;
				break;

			case 'file':
				init.body = Buffer.from((body as RequestBodyFile).payload.__hacky__binaryFileData!);
				break;

			default:
				throw new Error(`Unknown body type ${body.type}`);
		}

		const hasContentTypeHeader = TypedObject.keys(headers)
			.map(h => h.toLocaleLowerCase())
			.find(h => h === 'content-type');

		if (!hasContentTypeHeader && body.type !== 'text') {
			const contentType = requestBodyContentType(body);
			// `requestBodyContentType` returns undefined for body types Beak
			// doesn't auto-assign a Content-Type to (json_raw, grpc); skip
			// the header in that case so we don't write `undefined` into the
			// HTTP request.
			if (contentType) (init.headers as Record<string, string>)['Content-Type'] = contentType;
		}
	}

	return await fetch(url.toString(), init);
}

function headersToObject(entries: Iterable<[string, string]>) {
	const headers: Record<string, string> = {};

	for (const [key, value] of entries) headers[capitalizeHeader(key)] = value;

	return headers;
}

function capitalizeHeader(str: string): string {
	return str
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join('-');
}
