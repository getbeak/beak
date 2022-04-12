import {
	EditorPreferences,
	ProjectPanePreferences,
	RequestPreference,
	RequestPreferenceMainTab,
	ResponsePreferenceMainTab,
	SidebarPreferences,
} from '@beak/common/types/beak-hub';

export const ActionTypes = {
	LOAD_REQUEST_PREFERENCES: '@beak/global/preferences/LOAD_REQUEST_PREFERENCES',
	REQUEST_PREFERENCES_LOADED: '@beak/global/preferences/REQUEST_PREFERENCES_LOADED',
	REQUEST_PREFERENCE_SET_REQ_MAIN_TAB: '@beak/global/preferences/REQUEST_PREFERENCE_SET_REQ_MAIN_TAB',
	REQUEST_PREFERENCE_SET_REQ_JSON_EXPAND: '@beak/global/preferences/REQUEST_PREFERENCE_SET_REQ_JSON_EXPAND',
	REQUEST_PREFERENCE_SET_RES_MAIN_TAB: '@beak/global/preferences/REQUEST_PREFERENCE_SET_RES_MAIN_TAB',
	REQUEST_PREFERENCE_SET_RES_SUB_TAB: '@beak/global/preferences/REQUEST_PREFERENCE_SET_RES_SUB_TAB',

	LOAD_EDITOR_PREFERENCES: '@beak/global/preferences/LOAD_EDITOR_PREFERENCES',
	EDITOR_PREFERENCES_LOADED: '@beak/global/preferences/EDITOR_PREFERENCES_LOADED',
	EDITOR_PREFERENCES_SET_SELECTED_VARIABLE_GROUP: '@beak/global/preferences/EDITOR_PREFERENCES_SET_SELECTED_VARIABLE_GROUP',

	LOAD_SIDEBAR_PREFERENCES: '@beak/global/preferences/LOAD_SIDEBAR_PREFERENCES',
	SIDEBAR_PREFERENCES_LOADED: '@beak/global/preferences/SIDEBAR_PREFERENCES_LOADED',
	SIDEBAR_PREFERENCE_SET_SELECTED: '@beak/global/preferences/SIDEBAR_PREFERENCE_SET_SELECTED',
	SIDEBAR_PREFERENCE_SET_COLLAPSE: '@beak/global/preferences/SIDEBAR_PREFERENCE_SET_COLLAPSE',

	LOAD_PROJECT_PANE_PREFERENCES: '@beak/global/preferences/LOAD_PROJECT_PANE_PREFERENCES',
	PROJECT_PANE_PREFERENCES_LOADED: '@beak/global/preferences/PROJECT_PANE_PREFERENCES_LOADED',
	PROJECT_PANE_PREFERENCE_SET_COLLAPSE: '@beak/global/preferences/PROJECT_PANE_PREFERENCE_SET_COLLAPSE',
};

export interface State {
	requests: Record<string, RequestPreference>;
	editor: EditorPreferences;
	sidebar: SidebarPreferences;
	projectPane: ProjectPanePreferences;
}

export const initialState: State = {
	requests: {},
	editor: {
		selectedVariableGroups: {},
	},
	sidebar: {
		selected: 'project',
		collapsed: { },
	},
	projectPane: {
		collapsed: { },
	},
};

export type RequestPreferencePayload<T = void> = T extends void ? { id: string } : { id: string } & T;
export type RequestPreferencesLoadedPayload = RequestPreferencePayload<{ preferences: RequestPreference }>;
export type RequestPreferencesSetReqMainTabPayload = RequestPreferencePayload<{ tab: RequestPreferenceMainTab }>;
export type RequestPreferencesSetReqJsonExpandPayload = RequestPreferencePayload<{
	jsonId: string;
	expanded: boolean;
}>;
export type RequestPreferencesSetResMainTabPayload = RequestPreferencePayload<{ tab: ResponsePreferenceMainTab }>;
export type RequestPreferencesSetResSubTabPayload = RequestPreferencePayload<{
	tab: ResponsePreferenceMainTab;
	subTab: string;
}>;

export interface EditorPreferencesSetSelectedVariableGroupPayload {
	variableGroup: string;
	groupId: string;
}

export interface SidebarCollapsePayload {
	key: string;
	collapsed: boolean;
}

export interface ProjectPaneCollapsePayload {
	key: string;
	collapsed: boolean;
}

export default {
	ActionTypes,
	initialState,
};
