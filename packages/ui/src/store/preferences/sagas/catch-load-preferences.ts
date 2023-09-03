import { EditorPreferences, ProjectPanePreferences, RequestPreference, SidebarPreferences } from '@beak/common/types/beak-hub';
import { readJsonAndValidate } from '@beak/ui/lib/fs';
import { ipcFsService } from '@beak/ui/lib/ipc';
import { PayloadAction } from '@reduxjs/toolkit';
import path from 'path-browserify';
import { call, put } from 'redux-saga/effects';

import {
	editorPreferences,
	projectPanePreferences,
	requestPreference,
	sidebarPreferences,
} from '../../../lib/beak-hub/schemas';
import actions from '../actions';
import { ActionTypes, RequestPreferencePayload } from '../types';

export default function* catchLoadPreferences({ type, payload }: PayloadAction<unknown>) {
	switch (type) {
		case ActionTypes.LOAD_REQUEST_PREFERENCES: {
			const { id } = payload as RequestPreferencePayload;
			const preferences: RequestPreference = yield call(loadRequestPreferences, id);

			yield put(actions.requestPreferencesLoaded({ id, preferences }));

			return;
		}

		case ActionTypes.LOAD_EDITOR_PREFERENCES: {
			const preferences: EditorPreferences = yield call(loadEditorPreferences);

			yield put(actions.editorPreferencesLoaded(preferences));

			return;
		}

		case ActionTypes.LOAD_SIDEBAR_PREFERENCES: {
			const preferences: SidebarPreferences = yield call(loadSidebarPreferences);

			yield put(actions.sidebarPreferencesLoaded(preferences));

			return;
		}

		case ActionTypes.LOAD_PROJECT_PANE_PREFERENCES: {
			const preferences: ProjectPanePreferences = yield call(loadProjectPanePreferences);

			yield put(actions.projectPanePreferencesLoaded(preferences));

			return;
		}

		default:
			return;
	}
}

async function loadRequestPreferences(id: string) {
	const preferencesPath = path.join('.beak', 'preferences', 'requests', `${id}.json`);
	const defaultPreferences: RequestPreference = {
		request: {
			mainTab: 'headers',
		},
		response: {
			mainTab: 'response',
			subTab: {},
			pretty: {
				request: {
					language: null,
				},
				response: {
					language: null,
				},
			},
		},
	};

	if (!await ipcFsService.pathExists(preferencesPath))
		return defaultPreferences;

	try {
		const preferenceFile = await readJsonAndValidate<RequestPreference>(
			preferencesPath,
			requestPreference,
		);

		return preferenceFile.file;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Request preferences invalid:', error);

		return defaultPreferences;
	}
}

async function loadEditorPreferences() {
	const preferencesPath = path.join('.beak', 'preferences', 'editor.json');
	const defaultPreferences: EditorPreferences = {
		selectedVariableGroups: {},
	};

	if (!await ipcFsService.pathExists(preferencesPath))
		return defaultPreferences;

	try {
		const preferenceFile = await readJsonAndValidate<EditorPreferences>(
			preferencesPath,
			editorPreferences,
		);

		return preferenceFile.file;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Editor preferences invalid:', error);

		return defaultPreferences;
	}
}

async function loadSidebarPreferences() {
	const preferencesPath = path.join('.beak', 'preferences', 'sidebar.json');
	const defaultPreferences: SidebarPreferences = {
		selected: 'project',
		collapsed: {},
	};

	if (!await ipcFsService.pathExists(preferencesPath))
		return defaultPreferences;

	try {
		const preferenceFile = await readJsonAndValidate<SidebarPreferences>(
			preferencesPath,
			sidebarPreferences,
		);

		return preferenceFile.file;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Sidebar preferences invalid:', error);

		return defaultPreferences;
	}
}

async function loadProjectPanePreferences() {
	const preferencesPath = path.join('.beak', 'preferences', 'project-pane.json');
	const defaultPreferences: ProjectPanePreferences = {
		collapsed: {},
	};

	if (!await ipcFsService.pathExists(preferencesPath))
		return defaultPreferences;

	try {
		const preferenceFile = await readJsonAndValidate<ProjectPanePreferences>(
			preferencesPath,
			projectPanePreferences,
		);

		return preferenceFile.file;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Project preferences invalid:', error);

		return defaultPreferences;
	}
}
