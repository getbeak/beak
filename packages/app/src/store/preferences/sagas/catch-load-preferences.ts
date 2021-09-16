import { readJsonAndValidate } from '@beak/app/lib/fs';
import { ipcFsService } from '@beak/app/lib/ipc';
import { RequestPreference } from '@beak/common/types/beak-hub';
import Squawk from '@beak/common/utils/squawk';
import { PayloadAction } from '@reduxjs/toolkit';
import path from 'path-browserify';
import { call, put, select } from 'redux-saga/effects';

import { requestPreference } from '../../../lib/beak-hub/schemas';
import { ApplicationState } from '../..';
import actions from '../actions';
import { ActionTypes, RequestPreferencePayload } from '../types';

export default function* catchLoadPreferences({ type, payload }: PayloadAction<RequestPreferencePayload>) {
	const { id } = payload;
	const projectPath: string = yield select((s: ApplicationState) => s.global.project.projectPath);

	switch (type) {
		case ActionTypes.LOAD_REQUEST_PREFERENCES: {
			const preferences: RequestPreference = yield call(loadRequestPreferences, projectPath, id);

			yield put(actions.requestPreferencesLoaded({ id, preferences }));

			return;
		}

		default:
			return;
	}
}

async function loadRequestPreferences(projectPath: string, id: string) {
	const preferencesPath = path.join(projectPath, '.beak', 'preferences', 'requests', `${id}.json`);
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
