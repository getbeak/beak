import type {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequestPayload,
} from '@beak/common/types/requester';

export interface RequesterOptions {
	payload: FlightRequestPayload;
	/**
	 * Aborted by the flight-service when the renderer cancels the flight.
	 * Requesters MUST forward the signal to their underlying fetch / SSE
	 * stream so the upstream sees the disconnect and the agent's
	 * `ctx.Done()` fires.
	 */
	signal: AbortSignal;
	callbacks: {
		heartbeat: (payload: FlightHeartbeatPayload) => void;
		complete: (payload: FlightCompletePayload) => void;
		failed: (payload: FlightFailedPayload) => void;
	};
}

export interface Requester {
	start(options: RequesterOptions): Promise<void>;
}
