import type { RequestOverview } from '@getbeak/types/request';
import type { ResponseOverview } from '@getbeak/types/response';
import type { z } from 'zod';

import type {
	heartbeatFetchResponseSchema,
	heartbeatHeadReceivedSchema,
	heartbeatSseEventSchema,
	responseStreamKindSchema,
	sseEventSchema,
} from '../wire/agent';

export const FlightMessages = {
	heartbeat: 'flight_heartbeat',
	complete: 'flight_complete',
	failed: 'flight_failed',
};

/**
 * In-process callback shapes used by every requester (Electron's
 * `requester-node`, the browser-fetch fallback, the local-agent adapter).
 * Where these mirror the local-agent wire schemas in `../wire/agent/flight.ts`
 * we derive via `z.infer` so the two cannot drift; the divergences
 * (`reading_body.buffer` and `failed.error`) are spelled out below.
 */

export type ResponseStreamKind = z.infer<typeof responseStreamKindSchema>;

/**
 * One parsed Server-Sent Events frame (per https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream).
 */
export type SseEvent = z.infer<typeof sseEventSchema>;

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

export type FlightHeartbeatFetchResponse = z.infer<typeof heartbeatFetchResponseSchema>;

/**
 * Fired the moment `fetch()` resolves — carries the full response head (status,
 * headers, URL, content-type). Lets the renderer render the headers/status tab
 * before any body bytes arrive, which is essential for long responses, SSE
 * streams, and ranged downloads.
 */
export type FlightHeartbeatHeadReceived = z.infer<typeof heartbeatHeadReceivedSchema>;

/**
 * Diverges from the wire shape (`heartbeatReadingBodySchema.payload.buffer` is
 * base64-encoded `string`): once the adapter decodes the chunk, in-process
 * consumers get raw `Uint8Array` bytes.
 */
export interface FlightHeartbeatReadingBody {
	flightId: string;
	stage: 'reading_body';
	payload: {
		timestamp: number;
		buffer: Uint8Array;
	};
}

export type FlightHeartbeatSseEvent = z.infer<typeof heartbeatSseEventSchema>;

export interface FlightCompletePayload {
	flightId: string;
	timestamp: number;
	overview: ResponseOverview;
}

/**
 * Diverges from `flightFailedSchema` (which carries `{ message, code? }`) — at
 * the in-process boundary the adapter has already constructed a real `Error`
 * with the message; the slice stores the message text, not the instance.
 */
export interface FlightFailedPayload {
	flightId: string;
	error: Error;
}
