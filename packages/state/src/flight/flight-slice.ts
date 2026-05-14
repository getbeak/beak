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
	/** Latest state machine per request (idle / preparing / executing / completed / failed). */
	flightStates: Record<string, FlightState>;
	/** Per-request history of completed/failed flights. */
	flightHistories: Record<string, FlightHistory>;
	/** All currently in-flight flights keyed by flightId. Multiple per request allowed. */
	activeFlights: Record<string, FlightInProgress>;
	/** Index from requestId → ordered list of flightIds currently in flight. */
	flightsByRequest: Record<string, string[]>;
	/** Per-request "is anything loading for this request" — true if at least one active flight exists. */
	loading: Record<string, boolean>;
	/** Latest error per request (does not block new flights). */
	errors: Record<string, Error | null>;
}

const initialState: FlightSliceState = {
	flightStates: {},
	flightHistories: {},
	activeFlights: {},
	flightsByRequest: {},
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

function removeFlightFromRequest(state: FlightSliceState, requestId: string, flightId: string) {
	delete state.activeFlights[flightId];
	const ids = state.flightsByRequest[requestId];
	if (ids) {
		const remaining = ids.filter(id => id !== flightId);
		if (remaining.length > 0) state.flightsByRequest[requestId] = remaining;
		else delete state.flightsByRequest[requestId];
	}
	state.loading[requestId] = Boolean(state.flightsByRequest[requestId]?.length);
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
			for (const flightId of state.flightsByRequest[requestId] ?? []) delete state.activeFlights[flightId];
			delete state.flightsByRequest[requestId];
			delete state.loading[requestId];
			delete state.errors[requestId];
		},
		resetFlightState: state => {
			state.flightStates = {};
			state.flightHistories = {};
			state.activeFlights = {};
			state.flightsByRequest = {};
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
				state.activeFlights[flightId] = flight;
				const existing = state.flightsByRequest[requestId] ?? [];
				state.flightsByRequest[requestId] = [...existing, flightId];
				state.flightStates[requestId] = { status: 'executing', flight };
				state.loading[requestId] = true;
				state.errors[requestId] = null;
			})
			.addCase(updateFlightProgress, (state, action) => {
				const { flightId, heartbeat } = action.payload;
				const flight = state.activeFlights[flightId];
				if (!flight) return;

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
				const flight = state.activeFlights[flightId];
				if (!flight) return;

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
				removeFlightFromRequest(state, requestId, flightId);
			})
			.addCase(flightFailure, (state, action) => {
				const { requestId, flightId, error } = action.payload;
				const flight = state.activeFlights[flightId];
				if (!flight) return;

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

				state.flightStates[requestId] = { status: 'failed', error };
				state.errors[requestId] = error;
				removeFlightFromRequest(state, requestId, flightId);
			})
			.addCase(cancelFlightRequest, (state, action) => {
				const requestId = action.payload;
				for (const flightId of state.flightsByRequest[requestId] ?? []) delete state.activeFlights[flightId];
				delete state.flightsByRequest[requestId];
				state.loading[requestId] = false;
				state.flightStates[requestId] = { status: 'idle' };
				state.errors[requestId] = null;
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

/**
 * Returns the most recent active flight for a request, or null. With concurrent
 * flights, prefer `selectActiveFlightsForRequest` to see all of them.
 */
export const selectActiveFlight = (requestId: string) => (state: { global: { flight: FlightSliceState } }) => {
	const ids = state.global.flight.flightsByRequest[requestId];
	if (!ids?.length) return null;
	return state.global.flight.activeFlights[ids[ids.length - 1]] || null;
};

/** All active flights for a given request, in start order. */
export const selectActiveFlightsForRequest =
	(requestId: string) => (state: { global: { flight: FlightSliceState } }) => {
		const ids = state.global.flight.flightsByRequest[requestId] ?? [];
		return ids.map(id => state.global.flight.activeFlights[id]).filter(Boolean);
	};

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
