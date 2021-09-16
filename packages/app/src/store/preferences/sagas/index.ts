import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchLoadPreferences from './catch-load-preferences';

const loadPreferencesActions = [
	ActionTypes.LOAD_REQUEST_PREFERENCES,
];

export default function* projectSaga() {
	yield all([
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery(loadPreferencesActions, catchLoadPreferences);
		}),
	]);
}
