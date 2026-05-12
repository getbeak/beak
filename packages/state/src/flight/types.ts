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

/** A finalized flight (success or failure) stored in history. Shape-compatible with legacy `Flight`. */
export interface FlightHistoryEntry {
	flightId: string;
	requestId: string;
	request: RequestOverview;
	response?: ResponseOverview;
	error?: Error;
	binaryStoreKey: string;
	timing: FlightTiming;
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
	response?: ResponseOverview;
	error?: Error;
}

export type FlightState =
	| { status: 'idle' }
	| { status: 'preparing'; request: FlightRequest }
	| { status: 'executing'; flight: FlightInProgress }
	| { status: 'completed'; result: FlightHistoryEntry }
	| { status: 'failed'; error: FlightError };

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
export type HeartbeatStage = 'fetch_response' | 'parsing_response' | 'reading_body';

export interface FlightHeartbeatFetchResponse {
	stage: 'fetch_response';
	payload: { timestamp: number };
}

export interface FlightHeartbeatParsingResponse {
	stage: 'parsing_response';
	payload: { timestamp: number; contentLength: number };
}

export interface FlightHeartbeatReadingBody {
	stage: 'reading_body';
	payload: { timestamp: number; buffer: Uint8Array };
}

export type FlightHeartbeatPayload =
	| FlightHeartbeatFetchResponse
	| FlightHeartbeatParsingResponse
	| FlightHeartbeatReadingBody;

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
	error: Error;
}

export interface FlightHistoryChangePayload {
	requestId: string;
}
