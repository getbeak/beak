/* eslint-disable no-param-reassign */

import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const reducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.requestPreferencesLoaded, (state, { payload }) => {
			state.requests[payload.id] = payload.preferences;
		})
		.addCase(actions.requestPreferenceSetReqMainTab, (state, { payload }) => {
			state.requests[payload.id].request.mainTab = payload.tab;
		})
		.addCase(actions.requestPreferenceSetReqJsonExpand, (state, { payload }) => {
			state.requests[payload.id].request.jsonEditor = {
				expanded: {
					...state.requests[payload.id].request.jsonEditor?.expanded,
					[payload.jsonId]: payload.expanded,
				},
			};
		})
		.addCase(actions.requestPreferenceSetResMainTab, (state, { payload }) => {
			state.requests[payload.id].response.mainTab = payload.tab;
		})
		.addCase(actions.requestPreferenceSetResSubTab, (state, { payload }) => {
			state.requests[payload.id].response.subTab[payload.tab] = payload.subTab;
		})

		.addCase(actions.editorPreferencesLoaded, (state, { payload }) => {
			state.editor = payload;
		})
		.addCase(actions.editorPreferencesSetSelectedVariableGroup, (state, { payload }) => {
			const { variableGroup, groupId } = payload;

			state.editor.selectedVariableGroups[variableGroup] = groupId;
		})

		.addCase(actions.sidebarPreferencesLoaded, (state, { payload }) => {
			state.sidebar = payload;
		})
		.addCase(actions.sidebarPreferenceSetSelected, (state, { payload }) => {
			state.sidebar.selected = payload;
		})
		.addCase(actions.sidebarPreferenceSetCollapse, (state, { payload }) => {
			state.sidebar.collapsed[payload.key] = payload.collapsed;
		})

		.addCase(actions.projectPanePreferencesLoaded, (state, { payload }) => {
			state.projectPane = payload;
		})
		.addCase(actions.projectPanePreferenceSetCollapse, (state, { payload }) => {
			state.projectPane.collapsed[payload.key] = payload.collapsed;
		});
});

export default reducer;
