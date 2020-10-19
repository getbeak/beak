/* eslint-disable no-param-reassign */

import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const flightReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.cancelFlightRequest, (state, action) => {
			state.blackBox[action.payload] = false;
		})
		.addCase(actions.updateFlightProgress, (state, action) => {
			const { payload } = action;
			const { stage } = payload;

			switch (payload.stage) {
				case 'fetch_response':
					state.currentFlight!.start = payload.payload.timestamp;
					state.currentFlight!.lastUpdate = payload.payload.timestamp;

					return;

				case 'parsing_response':
					state.currentFlight!.contentLength = payload.payload.contentLength;
					state.currentFlight!.bodyTransferred = 0;
					state.currentFlight!.bodyTransferPercentage = 0;
					state.currentFlight!.lastUpdate = payload.payload.timestamp;

					return;

				case 'reading_body': {
					const bodyTransferred = state.currentFlight!.bodyTransferred! + payload.payload.buffer.length;
					const bodyTransferPercentage = ((bodyTransferred / state.currentFlight!.contentLength!) * 100);

					state.currentFlight!.bodyTransferred = bodyTransferred;
					state.currentFlight!.bodyTransferPercentage = bodyTransferPercentage;
					state.currentFlight!.lastUpdate = payload.payload.timestamp;

					return;
				}

				default:
					throw new Error(`unknown heartbeat stage: ${stage}`);
			}
		})
		.addCase(actions.completeFlight, (state, action) => {
			const { flightId, requestId, response } = action.payload;

			state.currentFlight!.response = response;
			state.currentFlight!.flighting = false;
			state.flightHistory[requestId] = [
				...state.flightHistory[requestId],
				{ flightId, requestId, request: state.currentFlight!.request, response },
			];
		})
		.addCase(actions.beginFlightRequest, (state, action) => {
			state.blackBox[action.payload.flightId] = true;
			state.currentFlight = {
				requestId: action.payload.requestId,
				flightId: action.payload.flightId,
				request: action.payload.request,
				flighting: true,
				binaryStoreKey: action.payload.binaryStoreKey,
			};
		});
});

export default flightReducer;
