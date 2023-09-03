import type { Flight, FlightHistory } from '@getbeak/types/flight';
import type {
	RequestBodyFile,
	RequestBodyText,
	RequestOptions,
	ToggleKeyValue,
} from '@getbeak/types/request';
import type { ResponseOverview } from '@getbeak/types/response';

export const ActionTypes = {
	REQUEST_FLIGHT: '@beak/global/flight/REQUEST_FLIGHT',
	REQUEST_PURE_FLIGHT: '@beak/global/flight/REQUEST_PURE_FLIGHT',

	BEGIN_FLIGHT: '@beak/global/flight/BEGIN_FLIGHT',
	UPDATE_FLIGHT_PROGRESS: '@beak/global/flight/UPDATE_FLIGHT_PROGRESS',
	COMPLETE_FLIGHT: '@beak/global/flight/COMPLETE_FLIGHT',
	FLIGHT_FAILURE: '@beak/global/flight/FLIGHT_FAILURE',

	NEXT_FLIGHT_HISTORY: '@beak/global/flight/NEXT_FLIGHT_HISTORY',
	PREVIOUS_FLIGHT_HISTORY: '@beak/global/flight/PREVIOUS_FLIGHT_HISTORY',

	CANCEL_FLIGHT_REQUEST: '@beak/global/flight/CANCEL_FLIGHT_REQUEST',
};

export type FlightReason = 'request_editor' | 'graphql_schema';
export type ShowResultMode = boolean | 'on_failure';

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

export interface State {
	currentFlight?: FlightInProgress;
	latestFlight?: FlightInProgress;
	flightHistory: Record<string, FlightHistory>;
	blackBox: Record<string, boolean>;
}

export const initialState: State = {
	flightHistory: {},
	blackBox: {},
};

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

export interface FlightInProgress extends Flight {
	flighting: boolean;
	lastUpdate?: number;
	timing: {
		beakStart: number;
		requestStart?: number;
		headersEnd?: number;
		responseEnd?: number;
		beakEnd?: number;
	};

	binaryStoreKey: string;
	contentLength?: number;
	bodyTransferred?: number;
	bodyTransferPercentage?: number;
	body?: Uint8Array;
}

export interface FlightHistoryChangePayload {
	requestId: string;
}

export default {
	ActionTypes,
	initialState,
};
