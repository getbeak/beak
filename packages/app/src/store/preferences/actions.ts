import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	RequestPreferencePayload,
	RequestPreferencesLoadedPayload,
	RequestPreferencesSetJsonExpandPayload,
	RequestPreferencesSetMainTabPayload,
} from './types';

export const loadRequestPreferences = createAction<RequestPreferencePayload>(AT.LOAD_REQUEST_PREFERENCES);
export const requestPreferencesLoaded = createAction<RequestPreferencesLoadedPayload>(AT.REQUEST_PREFERENCES_LOADED);
export const requestPreferenceSetMainTab = createAction<RequestPreferencesSetMainTabPayload>(AT.REQUEST_PREFERENCE_SET_MAIN_TAB);
export const requestPreferenceSetJsonExpand = createAction<RequestPreferencesSetJsonExpandPayload>(AT.REQUEST_PREFERENCE_SET_JSON_EXPAND);

export default {
	loadRequestPreferences,
	requestPreferencesLoaded,
};
