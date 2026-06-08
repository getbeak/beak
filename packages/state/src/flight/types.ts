import type {
	RequestBodyFile,
	RequestBodyText,
	RequestOptions,
	RequestOverview,
	ToggleKeyValue,
} from '@getbeak/types/request';
import type { ResponseOverview } from '@getbeak/types/response';

import type { FlightError, FlightErrorCode } from './errors';

export type { FlightError, FlightErrorCode };

export type FlightReason = 'request_editor' | 'graphql_schema' | 'automation' | 'manual';
export type ShowResultMode = boolean | 'on_failure';

export interface FlightTiming {
	beakStart: number;
	requestStart?: number;
	headersEnd?: number;
	responseEnd?: number;
	beakEnd?: number;
}

export interface FlightRequestKeyValue extends ToggleKeyValue {
	name: string;
	value: [string];
	enabled: boolean;
}

export interface FlightRequest {
	verb: string;
	url: [string];
	query: Record<string, FlightRequestKeyValue>;
	headers: Record<string, FlightRequestKeyValue>;
	body: RequestBodyText | RequestBodyFile;
	options: RequestOptions;
}

/** Serialised error stored in state and history (no live Error instance in the store). */
export interface FlightErrorShape {
	message: string;
	code?: string;
}

/** A finalized flight (success or failure) stored in history. Shape-compatible with legacy `Flight`. */
export interface FlightHistoryEntry {
	flightId: string;
	requestId: string;
	request: RequestOverview;
	response?: ResponseOverview;
	error?: FlightErrorShape;
	binaryStoreKey: string;
	timing: FlightTiming;
	/** For text/event-stream responses, the parsed event log accumulated during the flight. */
	sseEvents?: SseEvent[];
	/** Stream classification from the head — kept on the history entry so the inspector can pick the right viewer post-completion. */
	streamKind?: ResponseStreamKind;
}

export interface FlightHistoryMetadata {
	totalFlights: number;
	successfulExecutions: number;
	lastExecuted?: number;
	averageResponseTime?: number;
	successRate: number;
}

export interface FlightHistory {
	selected?: string;
	history: Record<string, FlightHistoryEntry>;
	metadata: FlightHistoryMetadata;
}

/** Stream classification reported with the response head. */
export type ResponseStreamKind = 'standard' | 'sse' | 'chunked';

/**
 * The response head — everything we know the instant `fetch()` resolves but
 * before any body bytes arrive. Persisted on the in-progress flight so the
 * Inspector can render headers/status before the body finishes streaming.
 */
export interface ResponseHead {
	receivedAt: number;
	status: number;
	headers: Record<string, string>;
	url: string;
	redirected: boolean;
	contentType: string | null;
	contentLength: number;
	streamKind: ResponseStreamKind;
}

/** One parsed Server-Sent Events frame appended to a flight's event log. */
export interface SseEvent {
	receivedAt: number;
	id?: string;
	event?: string;
	data: string;
	retry?: number;
}

/** A flight currently in progress (mutable). */
export interface FlightInProgress {
	requestId: string;
	flightId: string;
	request: FlightRequest;
	flighting: boolean;
	binaryStoreKey: string;
	timing: FlightTiming;
	lastUpdate?: number;
	contentLength?: number;
	bodyTransferred?: number;
	bodyTransferPercentage?: number;
	/** Set as soon as the host emits `head_received`. */
	head?: ResponseHead;
	/** Server-Sent Events accumulated when the response is `text/event-stream`. */
	sseEvents?: SseEvent[];
	response?: ResponseOverview;
	error?: FlightErrorShape;
}

export type FlightState =
	| { status: 'idle' }
	| { status: 'preparing'; request: FlightRequest }
	| { status: 'executing'; flight: FlightInProgress }
	| { status: 'completed'; result: FlightHistoryEntry }
	| { status: 'failed'; error: FlightErrorShape };

export interface FlightOptions {
	showProgress: boolean;
	showResult: ShowResultMode;
	reason: FlightReason;
	redirectDepth?: number;
	timeout?: number;
	maxRedirects?: number;
	followRedirects?: boolean;
	verifySSL?: boolean;
	allowInsecure?: boolean;
}

// IPC heartbeat payload variants (inlined to avoid coupling core to @beak/common).
// Must stay in sync with packages/common/src/types/requester.ts.
export type HeartbeatStage = 'fetch_response' | 'head_received' | 'reading_body' | 'sse_event';

export interface FlightHeartbeatFetchResponse {
	stage: 'fetch_response';
	payload: { timestamp: number };
}

export interface FlightHeartbeatHeadReceived {
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
	stage: 'reading_body';
	payload: { timestamp: number; buffer: Uint8Array };
}

export interface FlightHeartbeatSseEvent {
	stage: 'sse_event';
	payload: { timestamp: number; event: SseEvent };
}

export type FlightHeartbeatPayload =
	| FlightHeartbeatFetchResponse
	| FlightHeartbeatHeadReceived
	| FlightHeartbeatReadingBody
	| FlightHeartbeatSseEvent;

// Action payloads.

export interface RequestPureFlightPayload {
	flightId?: string;
	referenceRequestId: string;
	request: FlightRequest;
	showProgress?: boolean;
	showResult?: ShowResultMode;
	reason: FlightReason;
}

export interface BeginFlightPayload {
	requestId: string;
	flightId: string;
	binaryStoreKey: string;
	request: FlightRequest;
	redirectDepth: number;
	reason: FlightReason;
	showProgress: boolean;
	showResult: ShowResultMode;
	/** Millisecond timestamp minted by the caller at dispatch time (ADR 0005 §2). */
	timestamp: number;
}

export interface UpdateFlightProgressPayload {
	requestId: string;
	flightId: string;
	heartbeat: FlightHeartbeatPayload;
}

export interface CompleteFlightPayload {
	requestId: string;
	flightId: string;
	response: ResponseOverview;
	timestamp: number;
}

export interface FlightFailurePayload {
	requestId: string;
	flightId: string;
	/** Serialised error — no live Error instances cross the reducer boundary (ADR 0005 §2). */
	error: FlightErrorShape;
	/** Millisecond timestamp minted by the caller at dispatch time (ADR 0005 §2). */
	timestamp: number;
}

export interface FlightHistoryChangePayload {
	requestId: string;
}
