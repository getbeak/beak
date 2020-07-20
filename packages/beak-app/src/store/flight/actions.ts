import { deprecated } from 'typesafe-actions';

import { ActionTypes, BeginFlightPayload, CompleteFlightPayload, RequestFlightPayload } from './types';

const { createAction } = deprecated;

export const requestFlight = createAction(
	ActionTypes.REQUEST_FLIGHT,
	action => (payload: RequestFlightPayload) => action(payload),
);

export const cancelFlightRequest = createAction(
	ActionTypes.CANCEL_FLIGHT_REQUEST,
	action => (requestId: string) => action(requestId),
);

export const beginFlightRequest = createAction(
	ActionTypes.CANCEL_FLIGHT_REQUEST,
	action => (payload: BeginFlightPayload) => action(payload),
);

export const updateFlightProgress = createAction(
	ActionTypes.UPDATE_FLIGHT_PROGRESS,
	action => (percentage: number) => action(percentage),
);

export const completeFlight = createAction(
	ActionTypes.COMPLETE_FLIGHT,
	action => (payload: CompleteFlightPayload) => action(payload),
);

export default {
	requestFlight,
	cancelFlightRequest,
	beginFlightRequest,
	updateFlightProgress,
	completeFlight,
};
