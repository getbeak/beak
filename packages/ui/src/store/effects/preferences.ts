import type {
	EditorPreferences,
	ProjectPanePreferences,
	RequestPreference,
	SidebarPreferences,
} from '@beak/common/types/beak-hub';
import { readJsonAndValidate } from '@beak/ui/lib/fs';
import { ipcFsService } from '@beak/ui/lib/ipc';
import path from 'path-browserify';

import {
	editorPreferences,
	projectPanePreferences,
	requestPreference,
	sidebarPreferences,
} from '../../lib/beak-hub/schemas';
import type { AppStartListening } from '../listener';
import {
	editorPreferencesLoaded,
	editorPreferencesSetSelectedVariableGroup,
	loadEditorPreferences,
	loadProjectPanePreferences,
	loadRequestPreferences,
	loadSidebarPreferences,
	projectPanePreferenceSetCollapse,
	projectPanePreferencesLoaded,
	requestPreferenceSetReqJsonExpand,
	requestPreferenceSetReqMainTab,
	requestPreferenceSetResMainTab,
	requestPreferenceSetResPrettyLanguage,
	requestPreferenceSetResSubTab,
	requestPreferencesLoaded,
	sidebarPreferenceSetCollapse,
	sidebarPreferenceSetSelected,
	sidebarPreferencesLoaded,
} from '../preferences/actions';

export function registerPreferencesEffects(start: AppStartListening) {
	// Load preferences from disk on demand.
	start({
		actionCreator: loadRequestPreferences,
		effect: async ({ payload }, api) => {
			const preferences = await loadRequestPreferencesFile(payload.id);
			api.dispatch(requestPreferencesLoaded({ id: payload.id, preferences }));
		},
	});
	start({
		actionCreator: loadEditorPreferences,
		effect: async (_action, api) => {
			const preferences = await loadEditorPreferencesFile();
			api.dispatch(editorPreferencesLoaded(preferences));
		},
	});
	start({
		actionCreator: loadSidebarPreferences,
		effect: async (_action, api) => {
			const preferences = await loadSidebarPreferencesFile();
			api.dispatch(sidebarPreferencesLoaded(preferences));
		},
	});
	start({
		actionCreator: loadProjectPanePreferences,
		effect: async (_action, api) => {
			const preferences = await loadProjectPanePreferencesFile();
			api.dispatch(projectPanePreferencesLoaded(preferences));
		},
	});

	// Persist preferences back to disk when they change.
	const writeRequestPreferencesActions = [
		requestPreferenceSetReqMainTab,
		requestPreferenceSetReqJsonExpand,
		requestPreferenceSetResMainTab,
		requestPreferenceSetResSubTab,
		requestPreferenceSetResPrettyLanguage,
	];
	for (const ac of writeRequestPreferencesActions) {
		start({
			actionCreator: ac,
			effect: async ({ payload }, api) => {
				const state = api.getState();
				const prefs = state.global.preferences.requests[payload.id];
				if (!prefs) return;
				await ipcFsService.writeJson(path.join('.beak', 'preferences', 'requests', `${payload.id}.json`), prefs);
			},
		});
	}

	start({
		actionCreator: editorPreferencesSetSelectedVariableGroup,
		effect: async (_action, api) => {
			const prefs = api.getState().global.preferences.editor;
			if (!prefs) return;
			await ipcFsService.writeJson(path.join('.beak', 'preferences', 'editor.json'), prefs);
		},
	});

	for (const ac of [sidebarPreferenceSetSelected, sidebarPreferenceSetCollapse]) {
		start({
			actionCreator: ac,
			effect: async (_action, api) => {
				const prefs = api.getState().global.preferences.sidebar;
				if (!prefs) return;
				await ipcFsService.writeJson(path.join('.beak', 'preferences', 'sidebar.json'), prefs);
			},
		});
	}

	start({
		actionCreator: projectPanePreferenceSetCollapse,
		effect: async (_action, api) => {
			const prefs = api.getState().global.preferences.projectPane;
			if (!prefs) return;
			await ipcFsService.writeJson(path.join('.beak', 'preferences', 'project-pane.json'), prefs);
		},
	});
}

async function loadRequestPreferencesFile(id: string) {
	const preferencesPath = path.join('.beak', 'preferences', 'requests', `${id}.json`);
	const defaultPreferences = {
		request: { mainTab: 'headers' as const },
		response: {
			mainTab: 'response' as const,
			subTab: {},
			pretty: {
				request: { language: null },
				response: { language: null },
			},
		},
	};

	if (!(await ipcFsService.pathExists(preferencesPath))) return defaultPreferences;

	try {
		const preferenceFile = await readJsonAndValidate<RequestPreference>(preferencesPath, requestPreference);
		return preferenceFile.file;
	} catch (error) {
		console.warn('Request preferences invalid:', error);
		return defaultPreferences;
	}
}

async function loadEditorPreferencesFile() {
	const preferencesPath = path.join('.beak', 'preferences', 'editor.json');
	const defaultPreferences = { selectedVariableSets: {} };

	if (!(await ipcFsService.pathExists(preferencesPath))) return defaultPreferences;

	try {
		const preferenceFile = await readJsonAndValidate<EditorPreferences>(preferencesPath, editorPreferences);
		return preferenceFile.file;
	} catch (error) {
		console.warn('Editor preferences invalid:', error);
		return defaultPreferences;
	}
}

async function loadSidebarPreferencesFile() {
	const preferencesPath = path.join('.beak', 'preferences', 'sidebar.json');
	const defaultPreferences = { selected: 'project' as const, collapsed: {} };

	if (!(await ipcFsService.pathExists(preferencesPath))) return defaultPreferences;

	try {
		const preferenceFile = await readJsonAndValidate<SidebarPreferences>(preferencesPath, sidebarPreferences);
		return preferenceFile.file;
	} catch (error) {
		console.warn('Sidebar preferences invalid:', error);
		return defaultPreferences;
	}
}

async function loadProjectPanePreferencesFile() {
	const preferencesPath = path.join('.beak', 'preferences', 'project-pane.json');
	const defaultPreferences = { collapsed: {} };

	if (!(await ipcFsService.pathExists(preferencesPath))) return defaultPreferences;

	try {
		const preferenceFile = await readJsonAndValidate<ProjectPanePreferences>(preferencesPath, projectPanePreferences);
		return preferenceFile.file;
	} catch (error) {
		console.warn('Project preferences invalid:', error);
		return defaultPreferences;
	}
}
