import { all, fork, takeEvery, takeLatest } from '@redux-saga/core/effects';

import { ActionTypes } from '../types';
import catchLoadPreferences from './catch-load-preferences';
import catchWriteEditorPreferences from './catch-write-editor-preferences';
import catchWriteProjectPanePreferences from './catch-write-project-pane-preferences';
import catchWriteRequestPreferences from './catch-write-request-preferences';
import catchWriteSidebarPreferences from './catch-write-sidebar-preferences';

const loadPreferencesActions = [
	ActionTypes.LOAD_REQUEST_PREFERENCES,
	ActionTypes.LOAD_EDITOR_PREFERENCES,
	ActionTypes.LOAD_SIDEBAR_PREFERENCES,
	ActionTypes.LOAD_PROJECT_PANE_PREFERENCES,
];

const writeRequestPreferencesActions = [
	ActionTypes.REQUEST_PREFERENCE_SET_REQ_MAIN_TAB,
	ActionTypes.REQUEST_PREFERENCE_SET_REQ_JSON_EXPAND,
	ActionTypes.REQUEST_PREFERENCE_SET_RES_MAIN_TAB,
	ActionTypes.REQUEST_PREFERENCE_SET_RES_SUB_TAB,
	ActionTypes.REQUEST_PREFERENCE_SET_RES_PRETTY_LANGUAGE,
];

const writeEditorPreferencesActions = [
	ActionTypes.EDITOR_PREFERENCES_SET_SELECTED_VARIABLE_GROUP,
];

const writeSidebarPreferencesActions = [
	ActionTypes.SIDEBAR_PREFERENCE_SET_SELECTED,
	ActionTypes.SIDEBAR_PREFERENCE_SET_COLLAPSE,
];

const writeProjectPanePreferencesActions = [
	ActionTypes.PROJECT_PANE_PREFERENCE_SET_COLLAPSE,
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
		fork(function* catchWriteSidebarPreferencesWatcher() {
			yield takeLatest(writeSidebarPreferencesActions, catchWriteSidebarPreferences);
		}),
		fork(function* catchWriteProjectPanePreferencesWatcher() {
			yield takeLatest(writeProjectPanePreferencesActions, catchWriteProjectPanePreferences);
		}),
	]);
}
