import { TabPreferences } from '@beak/common/types/beak-hub';
import { ipcFsService } from '@beak/ui/lib/ipc';
import { ApplicationState } from '@beak/ui/store';
import { call, select } from '@redux-saga/core/effects';
import path from 'path-browserify';

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
