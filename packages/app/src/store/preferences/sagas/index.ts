import { all, fork, takeEvery, takeLatest } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchLoadPreferences from './catch-load-preferences';
import catchWriteRequestPreferences from './catch-write-request-preferences';

const loadPreferencesActions = [
	ActionTypes.LOAD_REQUEST_PREFERENCES,
];

const writeRequestPreferencesActions = [
	ActionTypes.REQUEST_PREFERENCE_SET_JSON_EXPAND,
	ActionTypes.REQUEST_PREFERENCE_SET_MAIN_TAB,
];

export default function* projectSaga() {
	yield all([
		fork(function* catchLoadPreferencesWatcher() {
			yield takeEvery(loadPreferencesActions, catchLoadPreferences);
		}),
		fork(function* catchWriteRequestPreferencesWatcher() {
			yield takeLatest(writeRequestPreferencesActions, catchWriteRequestPreferences);
		}),
	]);
}
