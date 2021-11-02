import { readJsonAndValidate } from '@beak/app/lib/fs';
import { ipcFsService } from '@beak/app/lib/ipc';
import { TabPreferences } from '@beak/common/types/beak-hub';
import { Nodes } from '@beak/common/types/beak-project';
import Squawk from '@beak/common/utils/squawk';
import path from 'path-browserify';
import { call, put, select } from 'redux-saga/effects';

import { tabPreferences } from '../../../lib/beak-hub/schemas';
import { ApplicationState } from '../..';
import { populateTabs, tabSelected } from '../actions';

export default function* workerLoadTabPreferences() {
	const tabPreferences: TabPreferences = yield call(loadTabPreferences);

	if (tabPreferences) {
		const selectedTab = tabPreferences.tabs.find(t => t.payload === tabPreferences.selectedTabPayload);

		yield put(populateTabs(tabPreferences.tabs));

		if (selectedTab)
			yield put(tabSelected(selectedTab));

		return;
	}

	const tree: Record<string, Nodes> = yield select((s: ApplicationState) => s.global.project.tree);
	const requestNode = Object.values(tree).find(n => n.type === 'request');

	if (requestNode)
		yield put(tabSelected({ type: 'request', payload: requestNode.id, temporary: false }));
}

async function loadTabPreferences() {
	const preferencesPath = path.join('.beak', 'preferences', 'tabs.json');

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
			// eslint-disable-next-line no-console
			console.error(error);

		return null;
	}
}
