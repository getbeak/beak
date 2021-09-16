import { all, fork, takeEvery, takeLatest } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchNodeUpdates from './catch-node-updates';
import catchTabUpdates from './catch-tab-updates';
import {
	workerCreateNewFolder as createNewFolder,
	workerCreateNewRequest as createNewRequest,
} from './create-things';
import duplicateRequest from './duplicate-request';
import loadTabPreferences from './load-tab-preferences';
import removeNodeFromDisk from './remove-node-from-disk';
import requestRename from './request-rename';
import startProject from './start-project';

const nodeUpdateWatcherActions = [
	ActionTypes.REQUEST_URI_UPDATED,
	ActionTypes.REQUEST_QUERY_ADDED,
	ActionTypes.REQUEST_QUERY_UPDATED,
	ActionTypes.REQUEST_QUERY_REMOVED,
	ActionTypes.REQUEST_HEADER_ADDED,
	ActionTypes.REQUEST_HEADER_UPDATED,
	ActionTypes.REQUEST_HEADER_REMOVED,
	ActionTypes.REQUEST_BODY_TYPE_CHANGED,
	ActionTypes.REQUEST_BODY_TEXT_CHANGED,
	ActionTypes.REQUEST_BODY_JSON_EDITOR_NAME_CHANGE,
	ActionTypes.REQUEST_BODY_JSON_EDITOR_TYPE_CHANGE,
	ActionTypes.REQUEST_BODY_JSON_EDITOR_VALUE_CHANGE,
	ActionTypes.REQUEST_BODY_JSON_EDITOR_ENABLED_CHANGE,
	ActionTypes.REQUEST_BODY_JSON_EDITOR_ADD_ENTRY,
	ActionTypes.REQUEST_BODY_JSON_EDITOR_REMOVE_ENTRY,
	ActionTypes.REQUEST_BODY_URL_ENCODED_EDITOR_NAME_CHANGE,
	ActionTypes.REQUEST_BODY_URL_ENCODED_EDITOR_VALUE_CHANGE,
	ActionTypes.REQUEST_BODY_URL_ENCODED_EDITOR_ADD_ITEM,
	ActionTypes.REQUEST_BODY_URL_ENCODED_EDITOR_REMOVE_ITEM,
	ActionTypes.REQUEST_BODY_URL_ENCODED_EDITOR_ENABLED_CHANGE,
	ActionTypes.REQUEST_OPTION_FOLLOW_REDIRECTS,
];

const tabUpdateWatcherActions = [
	ActionTypes.TAB_SELECTED,
	ActionTypes.CLOSE_SELECTED_TAB,
	ActionTypes.CLOSE_OTHER_SELECTED_TABS,
	ActionTypes.CLOSE_SELECTED_TABS_TO_RIGHT,
	ActionTypes.CLOSE_SELECTED_TABS_TO_LEFT,
	ActionTypes.CLOSE_ALL_SELECTED_TABS,
	ActionTypes.SET_TAB_AS_PERMANENT,
];

export default function* projectSaga() {
	yield all([
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery(nodeUpdateWatcherActions, catchNodeUpdates);
		}),

		fork(function* loadTabPreferencesWatcher() {
			yield takeEvery(ActionTypes.LOAD_TAB_PREFERENCES, loadTabPreferences);
		}),
		fork(function* catchTabUpdatesWatcher() {
			yield takeEvery(tabUpdateWatcherActions, catchTabUpdates);
		}),

		fork(function* createNewFolderWatcher() {
			yield takeEvery(ActionTypes.CREATE_NEW_FOLDER, createNewFolder);
		}),
		fork(function* createNewRequestWatcher() {
			yield takeEvery(ActionTypes.CREATE_NEW_REQUEST, createNewRequest);
		}),
		fork(function* duplicateRequestWatcher() {
			yield takeLatest(ActionTypes.DUPLICATE_REQUEST, duplicateRequest);
		}),
		fork(function* removeNodeFromDiskWatcher() {
			yield takeEvery(ActionTypes.REMOVE_NODE_FROM_DISK, removeNodeFromDisk);
		}),
		fork(function* requestRenameWatcher() {
			yield takeLatest(ActionTypes.REQUEST_RENAME_SUBMITTED, requestRename);
		}),
		fork(function* startProjectWatcher() {
			yield takeEvery(ActionTypes.START_PROJECT, startProject);
		}),
	]);
}
