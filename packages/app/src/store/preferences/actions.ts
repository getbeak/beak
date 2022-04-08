/* eslint-disable max-len */
import { EditorPreferences, ProjectPanePreferences, SidebarPreferences, SidebarVariant } from '@beak/common/types/beak-hub';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	EditorPreferencesSetSelectedVariableGroupPayload,
	ProjectPaneCollapsePayload,
	RequestPreferencePayload,
	RequestPreferencesLoadedPayload,
	RequestPreferencesSetJsonExpandPayload,
	RequestPreferencesSetMainTabPayload,
	SidebarCollapsePayload,
} from './types';

export const loadRequestPreferences = createAction<RequestPreferencePayload>(AT.LOAD_REQUEST_PREFERENCES);
export const requestPreferencesLoaded = createAction<RequestPreferencesLoadedPayload>(AT.REQUEST_PREFERENCES_LOADED);
export const requestPreferenceSetMainTab = createAction<RequestPreferencesSetMainTabPayload>(AT.REQUEST_PREFERENCE_SET_MAIN_TAB);
export const requestPreferenceSetJsonExpand = createAction<RequestPreferencesSetJsonExpandPayload>(AT.REQUEST_PREFERENCE_SET_JSON_EXPAND);

export const loadEditorPreferences = createAction(AT.LOAD_EDITOR_PREFERENCES);
export const editorPreferencesLoaded = createAction<EditorPreferences>(AT.EDITOR_PREFERENCES_LOADED);
export const editorPreferencesSetSelectedVariableGroup = createAction<EditorPreferencesSetSelectedVariableGroupPayload>(AT.EDITOR_PREFERENCES_SET_SELECTED_VARIABLE_GROUP);

export const loadSidebarPreferences = createAction(AT.LOAD_SIDEBAR_PREFERENCES);
export const sidebarPreferencesLoaded = createAction<SidebarPreferences>(AT.SIDEBAR_PREFERENCES_LOADED);
export const sidebarPreferenceSetSelected = createAction<SidebarVariant>(AT.SIDEBAR_PREFERENCE_SET_SELECTED);
export const sidebarPreferenceSetCollapse = createAction<SidebarCollapsePayload>(AT.SIDEBAR_PREFERENCE_SET_COLLAPSE);

export const loadProjectPanePreferences = createAction(AT.LOAD_PROJECT_PANE_PREFERENCES);
export const projectPanePreferencesLoaded = createAction<ProjectPanePreferences>(AT.PROJECT_PANE_PREFERENCES_LOADED);
export const projectPanePreferenceSetCollapse = createAction<ProjectPaneCollapsePayload>(AT.PROJECT_PANE_PREFERENCE_SET_COLLAPSE);

export default {
	loadRequestPreferences,
	requestPreferencesLoaded,
	requestPreferenceSetMainTab,
	requestPreferenceSetJsonExpand,

	loadEditorPreferences,
	editorPreferencesLoaded,
	editorPreferencesSetSelectedVariableGroup,

	loadSidebarPreferences,
	sidebarPreferencesLoaded,
	sidebarPreferenceSetSelected,
	sidebarPreferenceSetCollapse,

	loadProjectPanePreferences,
	projectPanePreferencesLoaded,
	projectPanePreferenceSetCollapse,
};
