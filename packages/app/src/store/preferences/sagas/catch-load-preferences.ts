import { readJsonAndValidate } from '@beak/app/lib/fs';
import { ipcFsService } from '@beak/app/lib/ipc';
import { RequestPreference } from '@beak/common/types/beak-hub';
import Squawk from '@beak/common/utils/squawk';
import { PayloadAction } from '@reduxjs/toolkit';
import path from 'path-browserify';
import { call, put } from 'redux-saga/effects';

import { requestPreference } from '../../../lib/beak-hub/schemas';
import actions from '../actions';
import { ActionTypes, RequestPreferencePayload } from '../types';

export default function* catchLoadPreferences({ type, payload }: PayloadAction<RequestPreferencePayload>) {
	const { id } = payload;

	switch (type) {
		case ActionTypes.LOAD_REQUEST_PREFERENCES: {
			const preferences: RequestPreference = yield call(loadRequestPreferences, id);

			yield put(actions.requestPreferencesLoaded({ id, preferences }));

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
