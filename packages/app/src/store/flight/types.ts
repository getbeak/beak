import { RequestOverview } from "@beak/common/src/beak-project/types";

export const ActionTypes = {
	REQUEST_FLIGHT: '@beak/global/flight/REQUEST_FLIGHT',
	BEGIN_FLIGHT: '@beak/global/flight/BEGIN_FLIGHT',
	UPDATE_FLIGHT_PROGRESS: '@beak/global/flight/UPDATE_FLIGHT_PROGRESS',
	COMPLETE_FLIGHT: '@beak/global/flight/COMPLETE_FLIGHT',

	CANCEL_FLIGHT_REQUEST: '@beak/global/flight/CANCEL_FLIGHT_REQUEST',
};

export interface State {
	currentFlight?: FlightInProgress;
	flightHistory: Record<string, Flight[]>;
	blackBox: Record<string, boolean>;
}

export const initialState: State = {
	flightHistory: {},
	blackBox: {},
};

export interface RequestFlightPayload {
	requestId: string;
	flightId: string;
	info: RequestOverview;
}

export interface BeginFlightPayload {
	requestId: string;
	flightId: string;
	info: RequestOverview;
}

export interface CompleteFlightPayload {
	requestId: string;
	flightId: string;
	info: RequestOverview;
	response: FlightResponse;
}

export interface Flight {
	requestId: string;
	flightId: string;
	info: RequestOverview;
	response?: FlightResponse;
}

export interface FlightResponse {
	statusCode: number;
	redirected: boolean;
	headers: Record<string, string>;
	length: number;
}

export interface FlightInProgress extends Flight {
	flighting: boolean;
	start?: number;
	binaryStoreKey?: string;
	contentLength?: number;
	body?: Buffer;
	finish?: number;
}

export default {
	ActionTypes,
	initialState,
};
