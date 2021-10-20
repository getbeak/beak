/* eslint-disable max-len */
import { EditorPreferences } from '@beak/common/types/beak-hub';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	EditorPreferencesSetSelectedVariableGroupPayload,
	RequestPreferencePayload,
	RequestPreferencesLoadedPayload,
	RequestPreferencesSetJsonExpandPayload,
	RequestPreferencesSetMainTabPayload,
} from './types';

export const loadRequestPreferences = createAction<RequestPreferencePayload>(AT.LOAD_REQUEST_PREFERENCES);
export const requestPreferencesLoaded = createAction<RequestPreferencesLoadedPayload>(AT.REQUEST_PREFERENCES_LOADED);
export const requestPreferenceSetMainTab = createAction<RequestPreferencesSetMainTabPayload>(AT.REQUEST_PREFERENCE_SET_MAIN_TAB);
export const requestPreferenceSetJsonExpand = createAction<RequestPreferencesSetJsonExpandPayload>(AT.REQUEST_PREFERENCE_SET_JSON_EXPAND);

export const loadEditorPreferences = createAction(AT.LOAD_EDITOR_PREFERENCES);
export const editorPreferencesLoaded = createAction<EditorPreferences>(AT.EDITOR_PREFERENCES_LOADED);
export const editorPreferencesSetSelectedVariableGroup = createAction<EditorPreferencesSetSelectedVariableGroupPayload>(AT.EDITOR_PREFERENCES_SET_SELECTED_VARIABLE_GROUP);


export default {
	loadRequestPreferences,
	requestPreferencesLoaded,
	requestPreferenceSetMainTab,
	requestPreferenceSetJsonExpand,

	loadEditorPreferences,
	editorPreferencesLoaded,
	editorPreferencesSetSelectedVariableGroup,
};
