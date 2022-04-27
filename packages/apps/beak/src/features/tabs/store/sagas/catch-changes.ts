import { ipcFsService } from '@beak/app-beak/lib/ipc';
import { ApplicationState } from '@beak/app-beak/store';
import { TabPreferences } from '@beak/shared-common/types/beak-hub';
import path from 'path-browserify';
import { call, select } from 'redux-saga/effects';

import { State } from '../types';

export default function* catchChanges() {
	const state: State = yield select((s: ApplicationState) => s.features.tabs);

	if (!state)
		return;

	yield call(writeTabPreferences, state);
}

async function writeTabPreferences(state: State) {
	const preferencesPath = path.join('.beak', 'preferences', 'tab-state.json');
	const preferences: TabPreferences = {
		tabs: state.activeTabs,
		selectedTabPayload: state.selectedTab,
	};

	await ipcFsService.writeJson(preferencesPath, preferences);
}
