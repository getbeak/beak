import { ipcFsService } from '@beak/app-beak/lib/ipc';
import { RequestPreference } from '@beak/shared-common/types/beak-hub';
import { PayloadAction } from '@reduxjs/toolkit';
import path from 'path-browserify';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { RequestPreferencePayload } from '../types';

export default function* catchWriteRequestPreferences({ payload }: PayloadAction<RequestPreferencePayload>) {
	const { id } = payload;
	const preferences: RequestPreference = yield select((s: ApplicationState) => s.global.preferences.requests[id]);

	if (!preferences)
		return;

	yield call(writeRequestPreferences, preferences, id);
}

async function writeRequestPreferences(preferences: RequestPreference, id: string) {
	const preferencesPath = path.join('.beak', 'preferences', 'requests', `${id}.json`);

	await ipcFsService.writeJson(preferencesPath, preferences);
}
