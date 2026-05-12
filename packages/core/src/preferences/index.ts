import type {
	EditorPreferences,
	ProjectPanePreferences,
	RequestPreference,
	RequestPreferenceMainTab,
	ResponsePreferenceMainTab,
	SidebarPreferences,
	SidebarVariant,
} from '@beak/common/types/beak-hub';
import { createAction, createReducer } from '@reduxjs/toolkit';

export interface PreferencesState {
	requests: Record<string, RequestPreference>;
	editor: EditorPreferences;
	sidebar: SidebarPreferences;
	projectPane: ProjectPanePreferences;
}

export const initialPreferencesState: PreferencesState = {
	requests: {},
	editor: { selectedVariableGroups: {} },
	sidebar: { selected: 'project', collapsed: {} },
	projectPane: { collapsed: {} },
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
export type RequestPreferencesSetResPrettyLanguagePayload = RequestPreferencePayload<{
	mode: 'request' | 'response';
	language: string | null;
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

// Saga triggers (side-effect intents). The reducer doesn't react to these directly.
export const loadRequestPreferences = createAction<{ id: string }>('preferences/loadRequestPreferences');
export const loadEditorPreferences = createAction('preferences/loadEditorPreferences');
export const loadSidebarPreferences = createAction('preferences/loadSidebarPreferences');
export const loadProjectPanePreferences = createAction('preferences/loadProjectPanePreferences');

// State updates.
export const requestPreferencesLoaded = createAction<RequestPreferencesLoadedPayload>(
	'preferences/requestPreferencesLoaded',
);
export const requestPreferenceSetReqMainTab =
	createAction<RequestPreferencesSetReqMainTabPayload>('preferences/setReqMainTab');
export const requestPreferenceSetReqJsonExpand =
	createAction<RequestPreferencesSetReqJsonExpandPayload>('preferences/setReqJsonExpand');
export const requestPreferenceSetResMainTab =
	createAction<RequestPreferencesSetResMainTabPayload>('preferences/setResMainTab');
export const requestPreferenceSetResSubTab =
	createAction<RequestPreferencesSetResSubTabPayload>('preferences/setResSubTab');
export const requestPreferenceSetResPrettyLanguage = createAction<RequestPreferencesSetResPrettyLanguagePayload>(
	'preferences/setResPrettyLanguage',
);

export const editorPreferencesLoaded = createAction<EditorPreferences>('preferences/editorLoaded');
export const editorPreferencesSetSelectedVariableGroup = createAction<EditorPreferencesSetSelectedVariableGroupPayload>(
	'preferences/editorSetSelectedVariableGroup',
);

export const sidebarPreferencesLoaded = createAction<SidebarPreferences>('preferences/sidebarLoaded');
export const sidebarPreferenceSetSelected = createAction<SidebarVariant>('preferences/sidebarSetSelected');
export const sidebarPreferenceSetCollapse = createAction<SidebarCollapsePayload>('preferences/sidebarSetCollapse');

export const projectPanePreferencesLoaded = createAction<ProjectPanePreferences>('preferences/projectPaneLoaded');
export const projectPanePreferenceSetCollapse = createAction<ProjectPaneCollapsePayload>(
	'preferences/projectPaneSetCollapse',
);

const preferencesReducer = createReducer(initialPreferencesState, builder => {
	builder
		.addCase(requestPreferencesLoaded, (state, { payload }) => {
			state.requests[payload.id] = payload.preferences;
		})
		.addCase(requestPreferenceSetReqMainTab, (state, { payload }) => {
			state.requests[payload.id].request.mainTab = payload.tab;
		})
		.addCase(requestPreferenceSetReqJsonExpand, (state, { payload }) => {
			state.requests[payload.id].request.jsonEditor = {
				expanded: {
					...state.requests[payload.id].request.jsonEditor?.expanded,
					[payload.jsonId]: payload.expanded,
				},
			};
		})
		.addCase(requestPreferenceSetResMainTab, (state, { payload }) => {
			state.requests[payload.id].response.mainTab = payload.tab;
		})
		.addCase(requestPreferenceSetResSubTab, (state, { payload }) => {
			state.requests[payload.id].response.subTab[payload.tab] = payload.subTab;
		})
		.addCase(requestPreferenceSetResPrettyLanguage, (state, { payload }) => {
			state.requests[payload.id].response.pretty[payload.mode].language = payload.language;
		})

		.addCase(editorPreferencesLoaded, (state, { payload }) => {
			state.editor = payload;
		})
		.addCase(editorPreferencesSetSelectedVariableGroup, (state, { payload }) => {
			state.editor.selectedVariableGroups[payload.variableGroup] = payload.groupId;
		})

		.addCase(sidebarPreferencesLoaded, (state, { payload }) => {
			state.sidebar = payload;
		})
		.addCase(sidebarPreferenceSetSelected, (state, { payload }) => {
			state.sidebar.selected = payload;
		})
		.addCase(sidebarPreferenceSetCollapse, (state, { payload }) => {
			state.sidebar.collapsed[payload.key] = payload.collapsed;
		})

		.addCase(projectPanePreferencesLoaded, (state, { payload }) => {
			state.projectPane = payload;
		})
		.addCase(projectPanePreferenceSetCollapse, (state, { payload }) => {
			state.projectPane.collapsed[payload.key] = payload.collapsed;
		});
});

export default preferencesReducer;
