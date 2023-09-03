import { TabPreferences } from '@beak/common/types/beak-hub';
import Squawk from '@beak/common/utils/squawk';
import { readJsonAndValidate } from '@beak/ui/lib/fs';
import { ipcFsService } from '@beak/ui/lib/ipc';
import { createTakeEverySagaSet } from '@beak/ui/utils/redux/sagas';
import path from 'path-browserify';
import { call, put } from 'redux-saga/effects';

import { tabPreferences } from '../../../../lib/beak-hub/schemas';
import actions from '../actions';
import { State } from '../types';

export default createTakeEverySagaSet(actions.loadTabState, function* worker() {
	try {
		const tabState: TabPreferences | null = yield call(loadTabStateFile);

		if (tabState !== null) {
			yield put(actions.tabStateLoaded({
				selectedTab: tabState.selectedTabPayload,
				activeTabs: tabState.tabs,
				recentlyClosedTabs: [],
				lastReconcile: 0,
				loaded: true,
			}));
			yield put(actions.attemptReconciliation());

			return;
		}
	} catch (error) {
		// On error, just fall back to default state and log the error
		// eslint-disable-next-line no-console
		console.error(error);
	}

	const tabState: State = {
		selectedTab: 'new_project_intro',
		activeTabs: [{ type: 'new_project_intro', temporary: false, payload: 'new_project_intro' }],
		recentlyClosedTabs: [],

		lastReconcile: 0,
		loaded: true,
	};

	yield put(actions.tabStateLoaded(tabState));
});

async function loadTabStateFile() {
	const preferencesPath = path.join('.beak', 'preferences', 'tab-state.json');

	if (!await ipcFsService.pathExists(preferencesPath))
		return null;

	try {
		const preferenceFile = await readJsonAndValidate<TabPreferences>(
			preferencesPath,
			tabPreferences,
		);

		return preferenceFile.file;
	} catch (error) {
		if (Squawk.coerce(error).code !== 'schema_invalid')
			throw error;

		return null;
	}
}
