import { ipcFsService } from '@beak/ui/lib/ipc';
import { SidebarPreferences } from '@beak/common/types/beak-hub';
import path from 'path-browserify';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';

export default function* catchWriteSidebarPreferences() {
	const preferences: SidebarPreferences = yield select((s: ApplicationState) => s.global.preferences.sidebar);

	if (!preferences)
		return;

	yield call(writeSidebarPreferences, preferences);
}

async function writeSidebarPreferences(preferences: SidebarPreferences) {
	const preferencesPath = path.join('.beak', 'preferences', 'sidebar.json');

	await ipcFsService.writeJson(preferencesPath, preferences);
}
