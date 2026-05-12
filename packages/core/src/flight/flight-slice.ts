import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
	beginFlightRequest,
	cancelFlightRequest,
	completeFlight,
	flightFailure,
	nextFlightHistory,
	previousFlightHistory,
	updateFlightProgress,
} from './actions';
import type { FlightHistory, FlightHistoryEntry, FlightInProgress, FlightState } from './types';

export interface FlightSliceState {
	flightStates: Record<string, FlightState>;
	flightHistories: Record<string, FlightHistory>;
	activeFlights: Record<string, FlightInProgress>;
	loading: Record<string, boolean>;
	errors: Record<string, Error | null>;
}

const initialState: FlightSliceState = {
	flightStates: {},
	flightHistories: {},
	activeFlights: {},
	loading: {},
	errors: {},
};

function ensureHistory(state: FlightSliceState, requestId: string): FlightHistory {
	let history = state.flightHistories[requestId];
	if (!history) {
		history = {
			selected: undefined,
			history: {},
			metadata: { totalFlights: 0, successfulExecutions: 0, successRate: 0 },
		};
		state.flightHistories[requestId] = history;
	}
	return history;
}

function recordHistoryEntry(history: FlightHistory, entry: FlightHistoryEntry) {
	history.history[entry.flightId] = entry;
	history.selected = entry.flightId;
	const total = history.metadata.totalFlights + 1;
	const successful = history.metadata.successfulExecutions + (entry.error ? 0 : 1);
	history.metadata = {
		totalFlights: total,
		successfulExecutions: successful,
		successRate: (successful / total) * 100,
		lastExecuted: Date.now(),
		averageResponseTime: history.metadata.averageResponseTime,
	};
}

const flightSlice = createSlice({
	name: 'flight',
	initialState,
	reducers: {
		setFlightHistory: (state, action: PayloadAction<{ requestId: string; history: FlightHistory }>) => {
			state.flightHistories[action.payload.requestId] = action.payload.history;
		},
		clearFlightData: (state, action: PayloadAction<{ requestId: string }>) => {
			const { requestId } = action.payload;
			delete state.flightStates[requestId];
			delete state.flightHistories[requestId];
			delete state.activeFlights[requestId];
			delete state.loading[requestId];
			delete state.errors[requestId];
		},
		resetFlightState: state => {
			state.flightStates = {};
			state.flightHistories = {};
			state.activeFlights = {};
			state.loading = {};
			state.errors = {};
		},
	},
	extraReducers: builder => {
		builder
			.addCase(beginFlightRequest, (state, action) => {
				const { requestId, flightId, request, binaryStoreKey } = action.payload;
				const flight: FlightInProgress = {
					requestId,
					flightId,
					request,
					binaryStoreKey,
					flighting: true,
					timing: { beakStart: Date.now() },
				};
				state.activeFlights[requestId] = flight;
				state.flightStates[requestId] = { status: 'executing', flight };
				state.loading[requestId] = true;
				state.errors[requestId] = null;
			})
			.addCase(updateFlightProgress, (state, action) => {
				const { requestId, flightId, heartbeat } = action.payload;
				const flight = state.activeFlights[requestId];
				if (!flight || flight.flightId !== flightId) return;

				switch (heartbeat.stage) {
					case 'fetch_response':
						flight.timing.requestStart = heartbeat.payload.timestamp;
						flight.lastUpdate = heartbeat.payload.timestamp;
						return;
					case 'parsing_response':
						flight.contentLength = heartbeat.payload.contentLength;
						flight.bodyTransferred = 0;
						flight.bodyTransferPercentage = 0;
						flight.lastUpdate = heartbeat.payload.timestamp;
						flight.timing.headersEnd = heartbeat.payload.timestamp;
						return;
					case 'reading_body': {
						const total = flight.contentLength ?? 0;
						const transferred = (flight.bodyTransferred ?? 0) + heartbeat.payload.buffer.length;
						flight.bodyTransferred = transferred;
						flight.bodyTransferPercentage = total > 0 ? (transferred / total) * 100 : 0;
						flight.lastUpdate = heartbeat.payload.timestamp;
						flight.timing.responseEnd = heartbeat.payload.timestamp;
						return;
					}
				}
			})
			.addCase(completeFlight, (state, action) => {
				const { requestId, flightId, response, timestamp } = action.payload;
				const flight = state.activeFlights[requestId];
				if (!flight || flight.flightId !== flightId) return;

				flight.response = response;
				flight.flighting = false;
				flight.timing.responseEnd = timestamp;
				flight.timing.beakEnd = Date.now();

				const entry: FlightHistoryEntry = {
					flightId,
					requestId,
					request: flight.request as unknown as FlightHistoryEntry['request'],
					response,
					binaryStoreKey: flight.binaryStoreKey,
					timing: { ...flight.timing },
				};

				const history = ensureHistory(state, requestId);
				recordHistoryEntry(history, entry);

				state.flightStates[requestId] = { status: 'completed', result: entry };
				state.loading[requestId] = false;
				delete state.activeFlights[requestId];
			})
			.addCase(flightFailure, (state, action) => {
				const { requestId, flightId, error } = action.payload;
				const flight = state.activeFlights[requestId];
				if (!flight || flight.flightId !== flightId) return;

				flight.error = error;
				flight.flighting = false;
				flight.timing.beakEnd = Date.now();

				const entry: FlightHistoryEntry = {
					flightId,
					requestId,
					request: flight.request as unknown as FlightHistoryEntry['request'],
					error,
					binaryStoreKey: flight.binaryStoreKey,
					timing: { ...flight.timing },
				};

				const history = ensureHistory(state, requestId);
				recordHistoryEntry(history, entry);

				state.errors[requestId] = error;
				state.loading[requestId] = false;
				delete state.activeFlights[requestId];
			})
			.addCase(cancelFlightRequest, (state, action) => {
				const requestId = action.payload;
				delete state.activeFlights[requestId];
				state.loading[requestId] = false;
			})
			.addCase(nextFlightHistory, (state, action) => {
				const { requestId } = action.payload;
				const history = state.flightHistories[requestId];
				if (!history?.selected) return;

				const ids = Object.keys(history.history);
				const currentIndex = ids.indexOf(history.selected);
				if (currentIndex >= 0 && currentIndex < ids.length - 1) history.selected = ids[currentIndex + 1];
			})
			.addCase(previousFlightHistory, (state, action) => {
				const { requestId } = action.payload;
				const history = state.flightHistories[requestId];
				if (!history?.selected) return;

				const ids = Object.keys(history.history);
				const currentIndex = ids.indexOf(history.selected);
				if (currentIndex > 0) history.selected = ids[currentIndex - 1];
			});
	},
});

export const { setFlightHistory, clearFlightData, resetFlightState } = flightSlice.actions;

export default flightSlice.reducer;

export const selectFlightState = (requestId: string) => (state: { global: { flight: FlightSliceState } }) =>
	state.global.flight.flightStates[requestId] || null;

export const selectFlightHistory = (requestId: string) => (state: { global: { flight: FlightSliceState } }) =>
	state.global.flight.flightHistories[requestId] || null;

export const selectActiveFlight = (requestId: string) => (state: { global: { flight: FlightSliceState } }) =>
	state.global.flight.activeFlights[requestId] || null;

export const selectFlightLoading = (requestId: string) => (state: { global: { flight: FlightSliceState } }) =>
	state.global.flight.loading[requestId] || false;

export const selectFlightError = (requestId: string) => (state: { global: { flight: FlightSliceState } }) =>
	state.global.flight.errors[requestId] || null;

export const selectAllFlightStates = (state: { global: { flight: FlightSliceState } }) =>
	state.global.flight.flightStates;

export const selectAllFlightHistories = (state: { global: { flight: FlightSliceState } }) =>
	state.global.flight.flightHistories;

export const selectAllActiveFlights = (state: { global: { flight: FlightSliceState } }) =>
	state.global.flight.activeFlights;
