import type { RequestOverview } from '@getbeak/types/request';
import type { ResponseOverview } from '@getbeak/types/response';

export const FlightMessages = {
	heartbeat: 'flight_heartbeat',
	complete: 'flight_complete',
	failed: 'flight_failed',
};

export type HeartbeatStage = 'fetch_response' | 'parsing_response' | 'reading_body';

export interface FlightRequestPayload {
	flightId: string;
	requestId: string;
	request: RequestOverview;
}

export type FlightHeartbeatPayload =
	| FlightHeartbeatFetchResponse
	| FlightHeartbeatParsingResponse
	| FlightHeartbeatReadingBody;

export interface FlightHeartbeatFetchResponse {
	flightId: string;
	stage: 'fetch_response';
	payload: {
		timestamp: number;
	};
}

export interface FlightHeartbeatParsingResponse {
	flightId: string;
	stage: 'parsing_response';
	payload: {
		timestamp: number;
		contentLength: number;
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

export interface FlightCompletePayload {
	flightId: string;
	timestamp: number;
	overview: ResponseOverview;
}

export interface FlightFailedPayload {
	flightId: string;
	error: Error;
}
