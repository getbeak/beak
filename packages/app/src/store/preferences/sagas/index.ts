import { all, fork, takeEvery, takeLatest } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchLoadPreferences from './catch-load-preferences';
import catchWriteEditorPreferences from './catch-write-editor-preferences';
import catchWriteRequestPreferences from './catch-write-request-preferences';

const loadPreferencesActions = [
	ActionTypes.LOAD_REQUEST_PREFERENCES,
	ActionTypes.LOAD_EDITOR_PREFERENCES,
];

const writeRequestPreferencesActions = [
	ActionTypes.REQUEST_PREFERENCE_SET_JSON_EXPAND,
	ActionTypes.REQUEST_PREFERENCE_SET_MAIN_TAB,
];

const writeEditorPreferencesActions = [
	ActionTypes.EDITOR_PREFERENCES_SET_SELECTED_VARIABLE_GROUP,
];

export default function* projectSaga() {
	yield all([
		fork(function* catchLoadPreferencesWatcher() {
			yield takeEvery(loadPreferencesActions, catchLoadPreferences);
		}),
		fork(function* catchWriteRequestPreferencesWatcher() {
			yield takeLatest(writeRequestPreferencesActions, catchWriteRequestPreferences);
		}),
		fork(function* catchWriteRequestPreferencesWatcher() {
			yield takeLatest(writeEditorPreferencesActions, catchWriteEditorPreferences);
		}),
	]);
}
