import { EditorPreferences, RequestPreference, RequestPreferenceMainTab } from '@beak/common/types/beak-hub';

export const ActionTypes = {
	LOAD_REQUEST_PREFERENCES: '@beak/global/preferences/LOAD_REQUEST_PREFERENCES',
	REQUEST_PREFERENCES_LOADED: '@beak/global/preferences/REQUEST_PREFERENCES_LOADED',
	REQUEST_PREFERENCE_SET_MAIN_TAB: '@beak/global/preferences/REQUEST_PREFERENCE_SET_MAIN_TAB',
	REQUEST_PREFERENCE_SET_JSON_EXPAND: '@beak/global/preferences/REQUEST_PREFERENCE_SET_JSON_EXPAND',

	LOAD_EDITOR_PREFERENCES: '@beak/global/preferences/LOAD_EDITOR_PREFERENCES',
	EDITOR_PREFERENCES_LOADED: '@beak/global/preferences/EDITOR_PREFERENCES_LOADED',
	EDITOR_PREFERENCES_SET_SELECTED_VARIABLE_GROUP: '@beak/global/preferences/EDITOR_PREFERENCES_SET_SELECTED_VARIABLE_GROUP',
};

export interface State {
	requests: Record<string, RequestPreference>;
	editor: EditorPreferences;
}

export const initialState: State = {
	requests: {},
	editor: {
		selectedVariableGroups: {},
	},
};

export type RequestPreferencePayload<T = void> = T extends void ? { id: string } : { id: string } & T;
export type RequestPreferencesLoadedPayload = RequestPreferencePayload<{ preferences: RequestPreference }>;
export type RequestPreferencesSetMainTabPayload = RequestPreferencePayload<{ tab: RequestPreferenceMainTab }>;
export type RequestPreferencesSetJsonExpandPayload = RequestPreferencePayload<{
	jsonId: string;
	expanded: boolean;
}>;

export interface EditorPreferencesSetSelectedVariableGroupPayload {
	variableGroup: string;
	groupId: string;
}

export default {
	ActionTypes,
	initialState,
};
