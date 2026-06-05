import { createSlice } from '@reduxjs/toolkit';

import { emptyRequestValues, type RequestValues } from '../schemas/request-values';
import {
	clearBodyPropertyValue,
	clearScalarValue,
	hydrateRequestValues,
	removeRequestValues,
	replaceRequestValues,
	setBodyPropertyValue,
	setBodyValue,
	setScalarValue,
	toggleScalarEnabled,
} from './actions';

export interface RequestValuesSliceState {
	/** True once `hydrateRequestValues` has run for the current project. */
	loaded: boolean;
	/** `requestId → RequestValues`. */
	requests: Record<string, RequestValues>;
}

const initialState: RequestValuesSliceState = {
	loaded: false,
	requests: {},
};

function ensureRequest(state: RequestValuesSliceState, requestId: string): RequestValues {
	let r = state.requests[requestId];
	if (!r) {
		r = emptyRequestValues();
		state.requests[requestId] = r;
	}
	return r;
}

const requestValuesSlice = createSlice({
	name: 'requestValues',
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder
			.addCase(hydrateRequestValues, (state, action) => {
				state.loaded = true;
				state.requests = action.payload.requests;
			})
			.addCase(replaceRequestValues, (state, action) => {
				state.requests[action.payload.requestId] = action.payload.values;
			})
			.addCase(removeRequestValues, (state, action) => {
				delete state.requests[action.payload.requestId];
			})
			.addCase(setScalarValue, (state, action) => {
				const r = ensureRequest(state, action.payload.requestId);
				r[action.payload.scope][action.payload.propertyId] = action.payload.value;
			})
			.addCase(clearScalarValue, (state, action) => {
				const r = state.requests[action.payload.requestId];
				if (!r) return;
				delete r[action.payload.scope][action.payload.propertyId];
			})
			.addCase(toggleScalarEnabled, (state, action) => {
				const r = state.requests[action.payload.requestId];
				if (!r) return;
				const cell = r[action.payload.scope][action.payload.propertyId];
				if (!cell) return;
				cell.enabled = action.payload.enabled;
			})
			.addCase(setBodyValue, (state, action) => {
				const r = ensureRequest(state, action.payload.requestId);
				r.body = action.payload.body;
			})
			.addCase(setBodyPropertyValue, (state, action) => {
				const r = ensureRequest(state, action.payload.requestId);
				if (r.body.type !== 'json' && r.body.type !== 'url_encoded_form' && r.body.type !== 'graphql') return;
				const bucket = r.body.type === 'graphql' ? r.body.variables : r.body.values;
				bucket[action.payload.propertyId] = action.payload.value;
			})
			.addCase(clearBodyPropertyValue, (state, action) => {
				const r = state.requests[action.payload.requestId];
				if (!r) return;
				if (r.body.type !== 'json' && r.body.type !== 'url_encoded_form' && r.body.type !== 'graphql') return;
				const bucket = r.body.type === 'graphql' ? r.body.variables : r.body.values;
				delete bucket[action.payload.propertyId];
			});
	},
});

export default requestValuesSlice.reducer;

type RootShape = { global: { requestValues: RequestValuesSliceState } };

/** Whole values envelope for a request, or `null` if absent. */
export const selectRequestValues =
	(requestId: string) =>
	(state: RootShape): RequestValues | null =>
		state.global.requestValues.requests[requestId] ?? null;

/** One scalar (header/query) cell, or `null` if unset. */
export const selectScalarValue =
	(requestId: string, scope: 'headers' | 'query', propertyId: string) => (state: RootShape) =>
		state.global.requestValues.requests[requestId]?.[scope][propertyId] ?? null;

/** True after hydration; UI may show a splash until then. */
export const selectRequestValuesLoaded = (state: RootShape) => state.global.requestValues.loaded;
