import { FlightHeartbeatPayload } from '@beak/common/types/requester';
import { createAction } from '@reduxjs/toolkit';

import { ActionTypes, BeginFlightPayload, CompleteFlightPayload, RequestFlightPayload } from './types';

export const requestFlight = createAction<RequestFlightPayload>(ActionTypes.REQUEST_FLIGHT);
export const cancelFlightRequest = createAction<string>(ActionTypes.CANCEL_FLIGHT_REQUEST);
export const beginFlightRequest = createAction<BeginFlightPayload>(ActionTypes.BEGIN_FLIGHT);
export const updateFlightProgress = createAction<FlightHeartbeatPayload>(ActionTypes.UPDATE_FLIGHT_PROGRESS);
export const completeFlight = createAction<CompleteFlightPayload>(ActionTypes.COMPLETE_FLIGHT);

export default {
	requestFlight,
	cancelFlightRequest,
	beginFlightRequest,
	updateFlightProgress,
	completeFlight,
};
