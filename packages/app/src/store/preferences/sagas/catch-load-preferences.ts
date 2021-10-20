import { readJsonAndValidate } from '@beak/app/lib/fs';
import { ipcFsService } from '@beak/app/lib/ipc';
import { EditorPreferences, RequestPreference } from '@beak/common/types/beak-hub';
import Squawk from '@beak/common/utils/squawk';
import { PayloadAction } from '@reduxjs/toolkit';
import path from 'path-browserify';
import { call, put } from 'redux-saga/effects';

import { editorPreferences, requestPreference } from '../../../lib/beak-hub/schemas';
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

		default:
			return;
	}
}

async function loadRequestPreferences(id: string) {
	const preferencesPath = path.join('.beak', 'preferences', 'requests', `${id}.json`);
	const defaultPreferences: RequestPreference = { mainTab: 'headers' };

	if (!await ipcFsService.pathExists(preferencesPath))
		return defaultPreferences;

	try {
		const preferenceFile = await readJsonAndValidate<RequestPreference>(
			preferencesPath,
			requestPreference,
		);

		return preferenceFile.file;
	} catch (error) {
		if (Squawk.coerce(error).code !== 'schema_invalid')
			throw error;

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
		if (Squawk.coerce(error).code !== 'schema_invalid')
			throw error;

		return defaultPreferences;
	}
}
