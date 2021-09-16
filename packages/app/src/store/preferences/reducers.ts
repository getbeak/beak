/* eslint-disable no-param-reassign */

import { combineReducers, createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const requestPreferencesReducer = createReducer(initialState.requests, builder => {
	builder
		.addCase(actions.requestPreferencesLoaded, (state, { payload }) => {
			state[payload.id] = payload.preferences;
		})
		.addCase(actions.requestPreferenceSetMainTab, (state, { payload }) => {
			state[payload.id].mainTab = payload.tab;
		})
		.addCase(actions.requestPreferenceSetJsonExpand, (state, { payload }) => {
			state[payload.id].jsonEditor = {
				expanded: {
					...state[payload.id].jsonEditor?.expanded,
					[payload.jsonId]: payload.expanded,
				},
			};
		});
});

export default combineReducers({
	requests: requestPreferencesReducer,
});
