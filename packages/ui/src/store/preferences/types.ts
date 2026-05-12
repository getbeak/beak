// Source of truth is @beak/core/preferences.
import {
	type EditorPreferencesSetSelectedVariableGroupPayload,
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
} from '@beak/core/preferences';

export type State = PreferencesState;
export const initialState: State = initialPreferencesState;

export type {
	EditorPreferencesSetSelectedVariableGroupPayload,
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
