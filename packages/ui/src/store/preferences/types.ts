// Source of truth is @beak/state/preferences.
import {
	type EditorPreferencesSetSelectedVariableSetPayload,
	initialPreferencesState,
	type PreferencesState,
	type ProjectPaneCollapsePayload,
	type RequestPreferencePayload,
	type RequestPreferencesLoadedPayload,
	type RequestPreferencesSetReqJsonExpandPayload,
	type RequestPreferencesSetReqMainTabPayload,
	type RequestPreferencesSetResMainTabPayload,
	type RequestPreferencesSetResPrettyLanguagePayload,
	type RequestPreferencesSetResSubTabPayload,
	type SidebarCollapsePayload,
} from '@beak/state/preferences';

export type State = PreferencesState;
export const initialState: State = initialPreferencesState;

export type {
	EditorPreferencesSetSelectedVariableSetPayload,
	ProjectPaneCollapsePayload,
	RequestPreferencePayload,
	RequestPreferencesLoadedPayload,
	RequestPreferencesSetReqJsonExpandPayload,
	RequestPreferencesSetReqMainTabPayload,
	RequestPreferencesSetResMainTabPayload,
	RequestPreferencesSetResPrettyLanguagePayload,
	RequestPreferencesSetResSubTabPayload,
	SidebarCollapsePayload,
};

export default { initialState };
