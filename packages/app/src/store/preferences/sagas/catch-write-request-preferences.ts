import { ipcFsService } from '@beak/app/lib/ipc';
import { RequestPreference } from '@beak/common/types/beak-hub';
import { PayloadAction } from '@reduxjs/toolkit';
import path from 'path-browserify';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { RequestPreferencePayload } from '../types';

export default function* catchLoadPreferences({ payload }: PayloadAction<RequestPreferencePayload>) {
	const { id } = payload;
	const projectPath: string = yield select((s: ApplicationState) => s.global.project.projectPath);
	const preferences: RequestPreference = yield select((s: ApplicationState) => s.global.preferences.requests[id]);

	if (!preferences)
		return;

	yield call(writeRequestPreferences, preferences, projectPath, id);
}

async function writeRequestPreferences(preferences: RequestPreference, projectPath: string, id: string) {
	const preferencesPath = path.join(projectPath, '.beak', 'preferences', 'requests', `${id}.json`);

	await ipcFsService.writeJson(preferencesPath, preferences);
}
