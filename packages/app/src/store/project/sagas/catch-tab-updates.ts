import { ipcFsService } from '@beak/app/lib/ipc';
import { TabPreferences } from '@beak/common/types/beak-hub';
import { TabItem } from '@beak/common/types/beak-project';
import path from 'path-browserify';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';

export default function* catchTabUpdatesWorker() {
	const tabs: TabItem[] = yield select((s: ApplicationState) => s.global.project.tabs);
	const selectedTab: string | undefined = yield select((s: ApplicationState) => s.global.project.selectedTabPayload);
	const tabPreferences: TabPreferences = {
		tabs,
		selectedTabPayload: selectedTab,
	};

	yield call(writeTabPreferences, tabPreferences);
}

async function writeTabPreferences(preferences: TabPreferences) {
	const preferencesPath = path.join('.beak', 'preferences', 'tabs.json');

	await ipcFsService.writeJson(preferencesPath, preferences);
}
