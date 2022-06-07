import { RequestOverview } from './request';
import { ResponseOverview } from './response';

export interface Flight {
	requestId: string;
	flightId: string;
	request: RequestOverview;
	response?: ResponseOverview;
	error?: Error;
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
