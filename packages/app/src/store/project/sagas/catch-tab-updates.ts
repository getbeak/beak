import BeakUserPreferences from '@beak/app/lib/beak-hub/user-preferences';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { State } from '../types';

export default function* catchTabUpdatesWorker() {
	const project: State = yield select((s: ApplicationState) => s.global.project);
	const { tabs, selectedTabPayload } = project;

	const userPrefs = BeakUserPreferences.getInstance();

	if (!userPrefs)
		return;

	yield call([userPrefs, userPrefs.setTabPreferences], tabs, selectedTabPayload);
}
