import { ipcFsService } from '@beak/app-beak/lib/ipc';
import { ProjectPanePreferences } from '@beak/shared-common/types/beak-hub';
import path from 'path-browserify';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';

export default function* catchWriteProjectPanePreferences() {
	const preferences: ProjectPanePreferences = yield select((s: ApplicationState) => s.global.preferences.projectPane);

	if (!preferences)
		return;

	yield call(writeProjectPanePreferences, preferences);
}

async function writeProjectPanePreferences(preferences: ProjectPanePreferences) {
	const preferencesPath = path.join('.beak', 'preferences', 'project-pane.json');

	await ipcFsService.writeJson(preferencesPath, preferences);
}
