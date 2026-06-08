import type { RequestBodyFile, RequestBodyText, RequestOptions, ToggleKeyValue } from '@getbeak/types/request';
import type { ResponseOverview } from '@getbeak/types/response';

import type { FlightBodyMultipart } from './multipart';

export const FlightMessages = {
	heartbeat: 'flight_heartbeat',
	complete: 'flight_complete',
	failed: 'flight_failed',
};

/**
 * Stream classification reported alongside the response head. The renderer
 * uses this to pick a viewer (raw bytes, SSE event log, chunked accumulation).
 */
export type ResponseStreamKind = 'standard' | 'sse' | 'chunked';

/**
 * One parsed Server-Sent Events frame (per https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream).
 * Emitted by the requester when the response content-type is `text/event-stream`.
 */
export interface SseEvent {
	receivedAt: number;
	id?: string;
	event?: string;
	data: string;
	retry?: number;
}

export type HeartbeatStage = 'fetch_response' | 'head_received' | 'reading_body' | 'sse_event';

/**
 * A {@link ToggleKeyValue}-shaped header / query entry, but with its value
 * already resolved to a single string. Flight prep walks every editable
 * row, runs the RTV resolver over its `value`, and emits this shape so the
 * requester never has to call into the renderer for substitution.
 */
export interface FlightRequestKeyValue extends ToggleKeyValue {
	name: string;
	value: [string];
	enabled: boolean;
}

/**
 * Wire shape of the request the requester executes. Everything is resolved
 * — query and headers carry concrete strings, the body is either a literal
 * string, a file with a {@link import('./value-producers').ValueProducerHandle},
 * or a flattened multipart with bytes / asset refs in hand.
 *
 * Lives here (not in `@beak/state`) per ADR 0003: types that cross the
 * renderer↔host boundary belong on the contract. `@beak/state/flight`
 * re-exports this type for renderer-side use.
 */
export interface FlightRequest {
	verb: string;
	url: [string];
	query: Record<string, FlightRequestKeyValue>;
	headers: Record<string, FlightRequestKeyValue>;
	body: RequestBodyText | RequestBodyFile | FlightBodyMultipart;
	options: RequestOptions;
}

export interface FlightRequestPayload {
	flightId: string;
	requestId: string;
	request: FlightRequest;
	/**
	 * Absolute path to the project root. The requester needs this to resolve
	 * asset producers (`<projectFolder>/_assets/<sha-prefix>/<sha>`) without
	 * going back through the renderer. Optional for hosts where filesystem
	 * access isn't available (web's local-agent path doesn't set it; asset
	 * producers buffer through inline bytes instead).
	 */
	projectFolder?: string;
}

export type FlightHeartbeatPayload =
	| FlightHeartbeatFetchResponse
	| FlightHeartbeatHeadReceived
	| FlightHeartbeatReadingBody
	| FlightHeartbeatSseEvent;

export interface FlightHeartbeatFetchResponse {
	flightId: string;
	stage: 'fetch_response';
	payload: {
		timestamp: number;
	};
}

/**
 * Fired the moment `fetch()` resolves — carries the full response head (status,
 * headers, URL, content-type). Lets the renderer render the headers/status tab
 * before any body bytes arrive, which is essential for long responses, SSE
 * streams, and ranged downloads.
 */
export interface FlightHeartbeatHeadReceived {
	flightId: string;
	stage: 'head_received';
	payload: {
		timestamp: number;
		status: number;
		headers: Record<string, string>;
		url: string;
		redirected: boolean;
		contentType: string | null;
		contentLength: number;
		streamKind: ResponseStreamKind;
	};
}

export interface FlightHeartbeatReadingBody {
	flightId: string;
	stage: 'reading_body';
	payload: {
		timestamp: number;
		buffer: Uint8Array;
	};
}

export interface FlightHeartbeatSseEvent {
	flightId: string;
	stage: 'sse_event';
	payload: {
		timestamp: number;
		event: SseEvent;
	};
}

export interface FlightCompletePayload {
	flightId: string;
	timestamp: number;
	overview: ResponseOverview;
}

export interface FlightFailedPayload {
	flightId: string;
	error: Error;
}
