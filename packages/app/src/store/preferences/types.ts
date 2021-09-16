import { RequestPreference, RequestPreferenceMainTab } from '@beak/common/types/beak-hub';

export const ActionTypes = {
	LOAD_REQUEST_PREFERENCES: '@beak/global/preferences/LOAD_REQUEST_PREFERENCES',
	REQUEST_PREFERENCES_LOADED: '@beak/global/preferences/REQUEST_PREFERENCES_LOADED',

	REQUEST_PREFERENCE_SET_MAIN_TAB: '@beak/global/preferences/REQUEST_PREFERENCE_SET_MAIN_TAB',
	REQUEST_PREFERENCE_SET_JSON_EXPAND: '@beak/global/preferences/REQUEST_PREFERENCE_SET_JSON_EXPAND',
};

export interface State {
	requestPreferences: Record<string, RequestPreference>;
}

export const initialState: State = {
	requestPreferences: {},
};

export type RequestPreferencePayload<T = void> = T extends void ? { id: string } : { id: string } & T;

export type RequestPreferencesLoadedPayload = RequestPreferencePayload<{ preferences: RequestPreference }>;
export type RequestPreferencesSetMainTabPayload = RequestPreferencePayload<{ tab: RequestPreferenceMainTab }>;
export type RequestPreferencesSetJsonExpandPayload = RequestPreferencePayload<{
	jsonId: string;
	expanded: boolean;
}>;

export default {
	ActionTypes,
	initialState,
};
