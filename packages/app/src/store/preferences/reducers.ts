/* eslint-disable no-param-reassign */

import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const reducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.requestPreferencesLoaded, (state, { payload }) => {
			state.requests[payload.id] = payload.preferences;
		})
		.addCase(actions.requestPreferenceSetMainTab, (state, { payload }) => {
			state.requests[payload.id].mainTab = payload.tab;
		})
		.addCase(actions.requestPreferenceSetJsonExpand, (state, { payload }) => {
			state.requests[payload.id].jsonEditor = {
				expanded: {
					...state.requests[payload.id].jsonEditor?.expanded,
					[payload.jsonId]: payload.expanded,
				},
			};
		})

		.addCase(actions.editorPreferencesLoaded, (state, { payload }) => {
			state.editor = payload;
		})
		.addCase(actions.editorPreferencesSetSelectedVariableGroup, (state, { payload }) => {
			const { variableGroup, groupId } = payload;

			state.editor.selectedVariableGroups[variableGroup] = groupId;
		});
});

export default reducer;
