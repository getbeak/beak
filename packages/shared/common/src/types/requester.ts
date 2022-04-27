import { RequestOverview, ResponseOverview } from './beak-project';

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

/* eslint-disable @typescript-eslint/indent */
export type FlightHeartbeatPayload =
	FlightHeartbeatFetchResponse |
	FlightHeartbeatParsingResponse |
	FlightHeartbeatReadingBody;
/* eslint-enable @typescript-eslint/indent */

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
