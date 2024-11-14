import { TypedObject } from '@beak/common/helpers/typescript';
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
					state.currentFlight!.timing.requestStart = payload.payload.timestamp;
					state.currentFlight!.lastUpdate = payload.payload.timestamp;

					return;

				case 'parsing_response':
					state.currentFlight!.contentLength = payload.payload.contentLength;
					state.currentFlight!.bodyTransferred = 0;
					state.currentFlight!.bodyTransferPercentage = 0;
					state.currentFlight!.lastUpdate = payload.payload.timestamp;
					state.currentFlight!.timing.headersEnd = payload.payload.timestamp;

					return;

				case 'reading_body': {
					const bodyTransferred = state.currentFlight!.bodyTransferred! + payload.payload.buffer.length;
					const bodyTransferPercentage = ((bodyTransferred / state.currentFlight!.contentLength!) * 100);

					state.currentFlight!.bodyTransferred = bodyTransferred;
					state.currentFlight!.bodyTransferPercentage = bodyTransferPercentage;
					state.currentFlight!.lastUpdate = payload.payload.timestamp;
					state.currentFlight!.timing.responseEnd = payload.payload.timestamp;

					return;
				}

				default:
					throw new Error(`unknown heartbeat stage: ${stage}`);
			}
		})
		.addCase(actions.completeFlight, (state, action) => {
			const { flightId, requestId, response, timestamp } = action.payload;
			const binaryStoreKey = state.currentFlight!.binaryStoreKey;

			state.currentFlight!.response = response;
			state.currentFlight!.flighting = false;
			state.currentFlight!.timing.responseEnd = timestamp;
			state.currentFlight!.timing.beakEnd = Date.now();

			if (!state.flightHistory[requestId]) {
				state.flightHistory[requestId] = {
					selected: void 0,
					history: {},
				};
			}

			state.flightHistory[requestId].selected = flightId;
			state.flightHistory[requestId].history[flightId] = {
				flightId,
				requestId,
				request: state.currentFlight!.request,
				response,
				binaryStoreKey,
				timing: state.currentFlight!.timing,
			};

			state.latestFlight = state.currentFlight;
			state.currentFlight = void 0;
		})
		.addCase(actions.flightFailure, (state, action) => {
			const { flightId, requestId, error } = action.payload;
			const binaryStoreKey = state.currentFlight!.binaryStoreKey;

			state.currentFlight!.error = error;
			state.currentFlight!.flighting = false;

			if (!state.flightHistory[requestId]) {
				state.flightHistory[requestId] = {
					selected: void 0,
					history: {},
				};
			}

			state.flightHistory[requestId].selected = flightId;
			state.flightHistory[requestId].history[flightId] = {
				flightId,
				requestId,
				request: state.currentFlight!.request,
				error,
				binaryStoreKey,
				timing: state.currentFlight!.timing,
			};
		})
		.addCase(actions.beginFlightRequest, (state, action) => {
			state.blackBox[action.payload.flightId] = true;
			state.currentFlight = {
				requestId: action.payload.requestId,
				flightId: action.payload.flightId,
				request: action.payload.request,
				binaryStoreKey: action.payload.binaryStoreKey,
				flighting: true,
				timing: { beakStart: Date.now() },
			};
		})

		.addCase(actions.nextFlightHistory, (state, action) => {
			const { requestId } = action.payload;
			const flightHistory = state.flightHistory[requestId];

			if (!flightHistory)
				return;

			const currentFlightId = flightHistory.selected;

			if (!currentFlightId)
				return;

			const flightHistoryKeys = TypedObject.keys(flightHistory.history);
			const currentFlightIndex = flightHistoryKeys.findIndex(i => currentFlightId === i);
			const nextFlightIndex = currentFlightIndex + 1;

			if (nextFlightIndex < 0)
				return;

			state.flightHistory[requestId].selected = flightHistoryKeys[nextFlightIndex];
		})
		.addCase(actions.previousFlightHistory, (state, action) => {
			const { requestId } = action.payload;
			const flightHistory = state.flightHistory[requestId];

			if (!flightHistory)
				return;

			const currentFlightId = flightHistory.selected;

			if (!currentFlightId)
				return;

			const flightHistoryKeys = TypedObject.keys(flightHistory.history);
			const currentFlightIndex = flightHistoryKeys.findIndex(i => currentFlightId === i);
			const nextFlightIndex = currentFlightIndex - 1;

			if (nextFlightIndex > flightHistoryKeys.length)
				return;

			state.flightHistory[requestId].selected = flightHistoryKeys[nextFlightIndex];
		});
});

export default flightReducer;
