import { FlightHeartbeatPayload } from '@beak/common/types/requester';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes,
	BeginFlightPayload,
	CompleteFlightPayload,
	FlightFailurePayload,
	FlightHistoryChangePayload,
	RequestPureFlightPayload,
} from './types';

export const requestFlight = createAction(ActionTypes.REQUEST_FLIGHT);
export const requestPureFlight = createAction<RequestPureFlightPayload>(ActionTypes.REQUEST_PURE_FLIGHT);
export const cancelFlightRequest = createAction<string>(ActionTypes.CANCEL_FLIGHT_REQUEST);
export const beginFlightRequest = createAction<BeginFlightPayload>(ActionTypes.BEGIN_FLIGHT);
export const updateFlightProgress = createAction<FlightHeartbeatPayload>(ActionTypes.UPDATE_FLIGHT_PROGRESS);
export const completeFlight = createAction<CompleteFlightPayload>(ActionTypes.COMPLETE_FLIGHT);
export const flightFailure = createAction<FlightFailurePayload>(ActionTypes.FLIGHT_FAILURE);
export const nextFlightHistory = createAction<FlightHistoryChangePayload>(ActionTypes.NEXT_FLIGHT_HISTORY);
export const previousFlightHistory = createAction<FlightHistoryChangePayload>(ActionTypes.PREVIOUS_FLIGHT_HISTORY);

export default {
	requestFlight,
	cancelFlightRequest,
	beginFlightRequest,
	updateFlightProgress,
	completeFlight,
	flightFailure,
	nextFlightHistory,
	previousFlightHistory,
};
