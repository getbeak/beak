import { isSseContentType, SseParser } from '@beak/common/helpers/sse-parser';
import { TypedObject } from '@beak/common/helpers/typescript';
import type {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequest,
	FlightRequestPayload,
	ResponseStreamKind,
} from '@beak/common/types/requester';
import fetch, { type RequestInit, type Response } from 'node-fetch';

import { assembleMultipart } from './multipart';
import { openAssetStreamOrBuffer } from './producer';

export type { StreamHost } from './stream-host';
export { registerStreamHost, streamProducerToReadable } from './stream-host';

// Verbs that semantically don't carry a body. Matches the renderer-side
// `requestAllowsBody` so both layers agree on which verbs get a body
// stripped — historically the two diverged on DELETE (renderer dropped,
// requester also dropped) and OPTIONS (neither dropped), which is wrong
// per RFC 9110 and inconsistent. Aligning on GET/HEAD/OPTIONS.
const bodyFreeVerbs = ['get', 'head', 'options'];

export interface RequesterOptions {
	payload: FlightRequestPayload;
	/**
	 * Aborted by the flight-service when the renderer cancels the flight.
	 * Forwarded to the underlying fetch + body-read loop so the upstream
	 * sees the disconnect promptly.
	 */
	signal?: AbortSignal;
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
	const { payload, signal, callbacks } = options;
	const { complete, failed, heartbeat } = callbacks;
	const { flightId, request, projectFolder } = payload;
	const start = Date.now();

	if (signal?.aborted) {
		failed({ flightId, error: new Error('flight_cancelled') });
		return;
	}

	heartbeat({ flightId, stage: 'fetch_response', payload: { timestamp: start } });

	let response: Response;
	try {
		response = await runRequest(request, projectFolder, signal);
	} catch (error) {
		if (signal?.aborted) {
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

async function runRequest(overview: FlightRequest, projectFolder?: string, signal?: AbortSignal) {
	const { body, headers, verb, options } = overview;
	const url = overview.url[0];

	const followRedirects = Boolean(options?.followRedirects);
	const decompressResponse = options?.decompressResponse ?? true;
	const timeoutMs = options?.timeoutMs ?? 0;
	const maxRedirects = options?.maxRedirects ?? 5;

	const init: RequestInit & { timeout?: number; follow?: number; signal?: AbortSignal } = {
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
		redirect: followRedirects ? 'follow' : 'manual',
		// node-fetch's `compress` flag accepts gzip/br/deflate and decodes
		// the body transparently when true. When the user opts out we leave
		// the encoded bytes alone so they can inspect raw payloads.
		compress: decompressResponse,
		timeout: timeoutMs > 0 ? timeoutMs : 0,
		follow: maxRedirects,
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
				// Asset producers stream from disk straight into node-fetch —
				// the bytes never sit in a Buffer in the requester. A 1 GB
				// upload allocates ~64 KiB at a time, not 1 GB. Inline (and
				// future stream) producers still go through the buffer
				// helper because they have no on-disk source.
				init.body = await openAssetStreamOrBuffer(producer, projectFolder);
				if (!hasContentTypeHeader) {
					const contentType = body.payload.contentType ?? 'application/octet-stream';
					(init.headers as Record<string, string>)['Content-Type'] = contentType;
				}
				break;
			}

			case 'multipart': {
				const { bytes, contentType } = await assembleMultipart(body, { projectFolder });
				init.body = bytes;
				// Multipart's Content-Type carries the boundary picked at
				// assembly time. Any user-set Content-Type on the request
				// would either ship without a boundary (and break the
				// server) or pin a stale boundary the assembler didn't use.
				// The override always wins.
				(init.headers as Record<string, string>)['Content-Type'] = contentType;
				break;
			}
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
