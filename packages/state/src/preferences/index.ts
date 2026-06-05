import type {
	EditorPreferences,
	PanePreferences,
	ProjectPanePreferences,
	RequestEditorMode,
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
	panes: PanePreferences;
}

export const initialPreferencesState: PreferencesState = {
	requests: {},
	editor: { selectedVariableSets: {} },
	sidebar: { selected: 'project', collapsed: {} },
	projectPane: { collapsed: {} },
	panes: { pixelSizes: {}, splitRatios: {} },
};

export type RequestPreferencePayload<T = void> = T extends void ? { id: string } : { id: string } & T;
export type RequestPreferencesLoadedPayload = RequestPreferencePayload<{ preferences: RequestPreference }>;
export type RequestPreferencesSetReqMainTabPayload = RequestPreferencePayload<{ tab: RequestPreferenceMainTab }>;
export type RequestPreferencesSetReqEditorModePayload = RequestPreferencePayload<{ mode: RequestEditorMode }>;
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

export interface EditorPreferencesSetSelectedVariableSetPayload {
	variableSet: string;
	setId: string;
}

export interface SidebarCollapsePayload {
	key: string;
	collapsed: boolean;
}

export interface ProjectPaneCollapsePayload {
	key: string;
	collapsed: boolean;
}

export interface PanePixelSizePayload {
	key: string;
	size: number;
}

export interface PaneSplitRatioPayload {
	key: string;
	ratio: number;
}

// Saga triggers (side-effect intents). The reducer doesn't react to these directly.
export const loadRequestPreferences = createAction<{ id: string }>('preferences/loadRequestPreferences');
export const loadEditorPreferences = createAction('preferences/loadEditorPreferences');
export const loadSidebarPreferences = createAction('preferences/loadSidebarPreferences');
export const loadProjectPanePreferences = createAction('preferences/loadProjectPanePreferences');
export const loadPanePreferences = createAction('preferences/loadPanePreferences');

// State updates.
export const requestPreferencesLoaded = createAction<RequestPreferencesLoadedPayload>(
	'preferences/requestPreferencesLoaded',
);
export const requestPreferenceSetReqMainTab =
	createAction<RequestPreferencesSetReqMainTabPayload>('preferences/setReqMainTab');
export const requestPreferenceSetReqEditorMode =
	createAction<RequestPreferencesSetReqEditorModePayload>('preferences/setReqEditorMode');
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
export const editorPreferencesSetSelectedVariableGroup = createAction<EditorPreferencesSetSelectedVariableSetPayload>(
	'preferences/editorSetSelectedVariableGroup',
);

export const sidebarPreferencesLoaded = createAction<SidebarPreferences>('preferences/sidebarLoaded');
export const sidebarPreferenceSetSelected = createAction<SidebarVariant>('preferences/sidebarSetSelected');
export const sidebarPreferenceSetCollapse = createAction<SidebarCollapsePayload>('preferences/sidebarSetCollapse');

export const projectPanePreferencesLoaded = createAction<ProjectPanePreferences>('preferences/projectPaneLoaded');
export const projectPanePreferenceSetCollapse = createAction<ProjectPaneCollapsePayload>(
	'preferences/projectPaneSetCollapse',
);
export const projectPanePreferenceSetShowHidden = createAction<boolean>('preferences/projectPaneSetShowHidden');
export const projectPanePreferenceSetExplorerFilter = createAction<'all' | 'requests' | 'workflows'>(
	'preferences/projectPaneSetExplorerFilter',
);

export const panePreferencesLoaded = createAction<PanePreferences>('preferences/panesLoaded');
export const panePreferenceSetPixelSize = createAction<PanePixelSizePayload>('preferences/panesSetPixelSize');
export const panePreferenceSetSplitRatio = createAction<PaneSplitRatioPayload>('preferences/panesSetSplitRatio');

const preferencesReducer = createReducer(initialPreferencesState, builder => {
	builder
		.addCase(requestPreferencesLoaded, (state, { payload }) => {
			state.requests[payload.id] = payload.preferences;
		})
		.addCase(requestPreferenceSetReqMainTab, (state, { payload }) => {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.request.mainTab = payload.tab;
		})
		.addCase(requestPreferenceSetReqEditorMode, (state, { payload }) => {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.request.editorMode = payload.mode;
		})
		.addCase(requestPreferenceSetReqJsonExpand, (state, { payload }) => {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.request.jsonEditor = {
				expanded: {
					...prefs.request.jsonEditor?.expanded,
					[payload.jsonId]: payload.expanded,
				},
			};
		})
		.addCase(requestPreferenceSetResMainTab, (state, { payload }) => {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.response.mainTab = payload.tab;
		})
		.addCase(requestPreferenceSetResSubTab, (state, { payload }) => {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.response.subTab[payload.tab] = payload.subTab;
		})
		.addCase(requestPreferenceSetResPrettyLanguage, (state, { payload }) => {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.response.pretty[payload.mode].language = payload.language;
		})

		.addCase(editorPreferencesLoaded, (state, { payload }) => {
			state.editor = payload;
		})
		.addCase(editorPreferencesSetSelectedVariableGroup, (state, { payload }) => {
			state.editor.selectedVariableSets[payload.variableSet] = payload.setId;
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
		})
		.addCase(projectPanePreferenceSetShowHidden, (state, { payload }) => {
			state.projectPane.showHiddenFolders = payload;
		})
		.addCase(projectPanePreferenceSetExplorerFilter, (state, { payload }) => {
			state.projectPane.explorerFilter = payload;
		})

		.addCase(panePreferencesLoaded, (state, { payload }) => {
			state.panes = payload;
		})
		.addCase(panePreferenceSetPixelSize, (state, { payload }) => {
			state.panes.pixelSizes[payload.key] = payload.size;
		})
		.addCase(panePreferenceSetSplitRatio, (state, { payload }) => {
			state.panes.splitRatios[payload.key] = payload.ratio;
		});
});

export default preferencesReducer;
