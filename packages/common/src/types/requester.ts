import type { RequestOverview } from '@getbeak/types/request';
import type { ResponseOverview } from '@getbeak/types/response';

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

export interface FlightRequestPayload {
	flightId: string;
	requestId: string;
	request: RequestOverview;
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
