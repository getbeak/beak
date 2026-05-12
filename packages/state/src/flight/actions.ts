import { createAction } from '@reduxjs/toolkit';

import type {
	BeginFlightPayload,
	CompleteFlightPayload,
	FlightFailurePayload,
	FlightHistoryChangePayload,
	RequestPureFlightPayload,
	UpdateFlightProgressPayload,
} from './types';

export const requestFlight = createAction('flight/requestFlight');
export const requestPureFlight = createAction<RequestPureFlightPayload>('flight/requestPureFlight');

export const beginFlightRequest = createAction<BeginFlightPayload>('flight/beginFlightRequest');
export const updateFlightProgress = createAction<UpdateFlightProgressPayload>('flight/updateFlightProgress');
export const completeFlight = createAction<CompleteFlightPayload>('flight/completeFlight');
export const flightFailure = createAction<FlightFailurePayload>('flight/flightFailure');

export const cancelFlightRequest = createAction<string>('flight/cancelFlightRequest');
export const nextFlightHistory = createAction<FlightHistoryChangePayload>('flight/nextFlightHistory');
export const previousFlightHistory = createAction<FlightHistoryChangePayload>('flight/previousFlightHistory');
