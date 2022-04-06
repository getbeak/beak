import { readJsonAndValidate } from '@beak/app/lib/fs';
import { ipcFsService } from '@beak/app/lib/ipc';
import { ApplicationState } from '@beak/app/store';
import { createTakeEverySagaSet } from '@beak/app/utils/redux/sagas';
import { TabPreferences } from '@beak/common/types/beak-hub';
import { Tree } from '@beak/common/types/beak-project';
import Squawk from '@beak/common/utils/squawk';
import path from 'path-browserify';
import { call, put, select } from 'redux-saga/effects';

import { tabPreferences } from '../../../../lib/beak-hub/schemas';
import actions from '../actions';

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

	const tree: Tree = yield select((s: ApplicationState) => s.global.project.tree);
	const request = Object.values(tree).find(n => n.type === 'request');

	yield put(actions.tabStateLoaded({
		selectedTab: request?.id,
		activeTabs: request === void 0 ? [] : [{
			type: 'request',
			temporary: false,
			payload: request.id,
		}],
		recentlyClosedTabs: [],

		lastReconcile: 0,
		loaded: true,
	}));
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
