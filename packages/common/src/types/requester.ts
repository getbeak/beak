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
	FlightHeartbeatFetchResponse |
	FlightHeartbeatParsingResponse |
	FlightHeartbeatReadingBody;

export interface FlightHeartbeatFetchResponse {
	stage: 'fetch_response';
	payload: {
		timestamp: number;
	};
}

export interface FlightHeartbeatParsingResponse {
	stage: 'parsing_response';
	payload: {
		timestamp: number;
		contentLength: number;
	};
}

export interface FlightHeartbeatReadingBody {
	stage: 'reading_body';
	payload: {
		timestamp: number;
		buffer: Uint8Array;
	};
}

export interface FlightCompletePayload {
	timestamp: number;
	overview: ResponseOverview;
}

export interface FlightFailedPayload {
	error: Error;
}
