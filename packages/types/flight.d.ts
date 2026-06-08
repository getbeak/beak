import { RequestOverview } from './request';
import { ResponseOverview } from './response';

/** Serialised flight error — no live Error instances in state (ADR 0005 §2). */
export interface FlightError {
	message: string;
	code?: string;
}

export interface Flight {
	requestId: string;
	flightId: string;
	request: RequestOverview;
	response?: ResponseOverview;
	error?: FlightError;
	timing: {
		beakStart: number;
		requestStart?: number;
		headersEnd?: number;
		responseEnd?: number;
		beakEnd?: number;
	};
	binaryStoreKey: string;
}

export interface FlightHistory {
	selected?: string;
	history: Record<string, Flight>;
}
