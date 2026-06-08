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
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

// NOTE: RequestPreference, EditorPreferences (beak-hub variant), SidebarPreferences,
// ProjectPanePreferences, and PanePreferences are imported from @beak/common/types/beak-hub.
// They cross the IPC boundary via @beak/state actions and project-preferences files.
// TODO ADR 0003: lift to @beak/common/ipc/preferences.ts when the IPC layer is
// formalised for per-request / per-pane preferences persistence.

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

const preferencesSlice = createSlice({
	name: 'preferences',
	initialState: initialPreferencesState,
	reducers: {
		// Saga triggers (side-effect intents). The reducer doesn't mutate state —
		// these actions exist solely so effects can listen to them via actionCreator.
		loadRequestPreferences: {
			reducer() {},
			prepare: (payload: { id: string }) => ({ payload }),
		},
		loadEditorPreferences() {},
		loadSidebarPreferences() {},
		loadProjectPanePreferences() {},
		loadPanePreferences() {},

		// State updates — request preferences.
		requestPreferencesLoaded(state, { payload }: PayloadAction<RequestPreferencesLoadedPayload>) {
			state.requests[payload.id] = payload.preferences;
		},
		requestPreferenceSetReqMainTab(state, { payload }: PayloadAction<RequestPreferencesSetReqMainTabPayload>) {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.request.mainTab = payload.tab;
		},
		requestPreferenceSetReqEditorMode(state, { payload }: PayloadAction<RequestPreferencesSetReqEditorModePayload>) {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.request.editorMode = payload.mode;
		},
		requestPreferenceSetReqJsonExpand(state, { payload }: PayloadAction<RequestPreferencesSetReqJsonExpandPayload>) {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.request.jsonEditor = {
				expanded: {
					...prefs.request.jsonEditor?.expanded,
					[payload.jsonId]: payload.expanded,
				},
			};
		},
		requestPreferenceSetResMainTab(state, { payload }: PayloadAction<RequestPreferencesSetResMainTabPayload>) {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.response.mainTab = payload.tab;
		},
		requestPreferenceSetResSubTab(state, { payload }: PayloadAction<RequestPreferencesSetResSubTabPayload>) {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.response.subTab[payload.tab] = payload.subTab;
		},
		requestPreferenceSetResPrettyLanguage(
			state,
			{ payload }: PayloadAction<RequestPreferencesSetResPrettyLanguagePayload>,
		) {
			const prefs = state.requests[payload.id];
			if (!prefs) return;
			prefs.response.pretty[payload.mode].language = payload.language;
		},

		// State updates — editor preferences.
		editorPreferencesLoaded(state, { payload }: PayloadAction<EditorPreferences>) {
			state.editor = payload;
		},
		editorPreferencesSetSelectedVariableGroup(
			state,
			{ payload }: PayloadAction<EditorPreferencesSetSelectedVariableSetPayload>,
		) {
			state.editor.selectedVariableSets[payload.variableSet] = payload.setId;
		},

		// State updates — sidebar preferences.
		sidebarPreferencesLoaded(state, { payload }: PayloadAction<SidebarPreferences>) {
			state.sidebar = payload;
		},
		sidebarPreferenceSetSelected(state, { payload }: PayloadAction<SidebarVariant>) {
			state.sidebar.selected = payload;
		},
		sidebarPreferenceSetCollapse(state, { payload }: PayloadAction<SidebarCollapsePayload>) {
			state.sidebar.collapsed[payload.key] = payload.collapsed;
		},

		// State updates — project pane preferences.
		projectPanePreferencesLoaded(state, { payload }: PayloadAction<ProjectPanePreferences>) {
			state.projectPane = payload;
		},
		projectPanePreferenceSetCollapse(state, { payload }: PayloadAction<ProjectPaneCollapsePayload>) {
			state.projectPane.collapsed[payload.key] = payload.collapsed;
		},
		projectPanePreferenceSetShowHidden(state, { payload }: PayloadAction<boolean>) {
			state.projectPane.showHiddenFolders = payload;
		},
		projectPanePreferenceSetExplorerFilter(state, { payload }: PayloadAction<'all' | 'requests' | 'workflows'>) {
			state.projectPane.explorerFilter = payload;
		},

		// State updates — pane (pixel sizes / split ratios).
		panePreferencesLoaded(state, { payload }: PayloadAction<PanePreferences>) {
			state.panes = payload;
		},
		panePreferenceSetPixelSize(state, { payload }: PayloadAction<PanePixelSizePayload>) {
			state.panes.pixelSizes[payload.key] = payload.size;
		},
		panePreferenceSetSplitRatio(state, { payload }: PayloadAction<PaneSplitRatioPayload>) {
			state.panes.splitRatios[payload.key] = payload.ratio;
		},
	},
});

// Named action creators — names preserved 1:1 from the legacy createReducer form.
export const {
	loadRequestPreferences,
	loadEditorPreferences,
	loadSidebarPreferences,
	loadProjectPanePreferences,
	loadPanePreferences,
	requestPreferencesLoaded,
	requestPreferenceSetReqMainTab,
	requestPreferenceSetReqEditorMode,
	requestPreferenceSetReqJsonExpand,
	requestPreferenceSetResMainTab,
	requestPreferenceSetResSubTab,
	requestPreferenceSetResPrettyLanguage,
	editorPreferencesLoaded,
	editorPreferencesSetSelectedVariableGroup,
	sidebarPreferencesLoaded,
	sidebarPreferenceSetSelected,
	sidebarPreferenceSetCollapse,
	projectPanePreferencesLoaded,
	projectPanePreferenceSetCollapse,
	projectPanePreferenceSetShowHidden,
	projectPanePreferenceSetExplorerFilter,
	panePreferencesLoaded,
	panePreferenceSetPixelSize,
	panePreferenceSetSplitRatio,
} = preferencesSlice.actions;

// Named selectors — ADR 0005 §3.
// Each selector receives the PreferencesState slice (not the full global store),
// so they compose cleanly in both useAppSelector inline wrappers and effects.

/** The full request-preferences map. */
export const selectPreferencesRequests = (state: PreferencesState) => state.requests;

/** Preferences for a single request by id. */
export const selectPreferencesRequest = (state: PreferencesState, id: string) => state.requests[id];

/** The full editor-preferences object. */
export const selectPreferencesEditor = (state: PreferencesState) => state.editor;

/** Variable-set selections keyed by variable-set id. */
export const selectPreferencesEditorSelectedVariableSets = (state: PreferencesState) =>
	state.editor.selectedVariableSets;

/** The full sidebar-preferences object. */
export const selectPreferencesSidebar = (state: PreferencesState) => state.sidebar;

/** Currently selected sidebar panel. */
export const selectPreferencesSidebarSelected = (state: PreferencesState) => state.sidebar.selected;

/** Sidebar collapse map keyed by collapse key. */
export const selectPreferencesSidebarCollapsed = (state: PreferencesState) => state.sidebar.collapsed;

/** The full project-pane preferences object. */
export const selectPreferencesProjectPane = (state: PreferencesState) => state.projectPane;

/** Project-pane folder collapse map keyed by collapse key. */
export const selectPreferencesProjectPaneCollapsed = (state: PreferencesState) => state.projectPane.collapsed;

/** Whether hidden folders are shown in the project pane. */
export const selectPreferencesProjectPaneShowHiddenFolders = (state: PreferencesState) =>
	state.projectPane.showHiddenFolders;

/** Active explorer filter ('all' | 'requests' | 'workflows'). */
export const selectPreferencesProjectPaneExplorerFilter = (state: PreferencesState) =>
	state.projectPane.explorerFilter ?? 'all';

/** The full panes-preferences object. */
export const selectPreferencesPanes = (state: PreferencesState) => state.panes;

/** Pixel-size map for fixed-size panes, keyed by pane key. */
export const selectPreferencesPanesPixelSizes = (state: PreferencesState) => state.panes.pixelSizes;

/** Split-ratio map for resizable panes, keyed by pane key. */
export const selectPreferencesPanesSplitRatios = (state: PreferencesState) => state.panes.splitRatios;

export default preferencesSlice.reducer;
