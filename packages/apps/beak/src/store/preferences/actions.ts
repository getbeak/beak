/* eslint-disable max-len */
import { EditorPreferences, ProjectPanePreferences, SidebarPreferences, SidebarVariant } from '@beak/shared-common/types/beak-hub';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	EditorPreferencesSetSelectedVariableGroupPayload,
	ProjectPaneCollapsePayload,
	RequestPreferencePayload,
	RequestPreferencesLoadedPayload,
	RequestPreferencesSetReqJsonExpandPayload,
	RequestPreferencesSetReqMainTabPayload,
	RequestPreferencesSetResMainTabPayload,
	RequestPreferencesSetResPrettyAutoDetectPayload,
	RequestPreferencesSetResPrettyLanguagePayload,
	RequestPreferencesSetResSubTabPayload,
	SidebarCollapsePayload,
} from './types';

export const loadRequestPreferences = createAction<RequestPreferencePayload>(AT.LOAD_REQUEST_PREFERENCES);
export const requestPreferencesLoaded = createAction<RequestPreferencesLoadedPayload>(AT.REQUEST_PREFERENCES_LOADED);
export const requestPreferenceSetReqMainTab = createAction<RequestPreferencesSetReqMainTabPayload>(AT.REQUEST_PREFERENCE_SET_REQ_MAIN_TAB);
export const requestPreferenceSetReqJsonExpand = createAction<RequestPreferencesSetReqJsonExpandPayload>(AT.REQUEST_PREFERENCE_SET_REQ_JSON_EXPAND);
export const requestPreferenceSetResMainTab = createAction<RequestPreferencesSetResMainTabPayload>(AT.REQUEST_PREFERENCE_SET_RES_MAIN_TAB);
export const requestPreferenceSetResSubTab = createAction<RequestPreferencesSetResSubTabPayload>(AT.REQUEST_PREFERENCE_SET_RES_SUB_TAB);
export const requestPreferenceSetResPrettyAutoDetect = createAction<RequestPreferencesSetResPrettyAutoDetectPayload>(AT.REQUEST_PREFERENCE_SET_RES_PRETTY_AUTO_DETECT);
export const requestPreferenceSetResPrettyLanguage = createAction<RequestPreferencesSetResPrettyLanguagePayload>(AT.REQUEST_PREFERENCE_SET_RES_PRETTY_LANGUAGE);

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
	requestPreferenceSetReqMainTab,
	requestPreferenceSetReqJsonExpand,
	requestPreferenceSetResMainTab,
	requestPreferenceSetResSubTab,
	requestPreferenceSetResPrettyAutoDetect,
	requestPreferenceSetResPrettyLanguage,

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
