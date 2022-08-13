import { all, fork, takeEvery, takeLatest } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchNodeUpdates from './catch-node-updates';
import {
	workerCreateNewFolder as createNewFolder,
	workerCreateNewRequest as createNewRequest,
} from './create-things';
import duplicateRequest from './duplicate-request';
import moveNodeOnDisk from './move-node-on-disk';
import nodeRename from './node-rename';
import removeNodeFromDisk from './remove-node-from-disk';
import revealRequest from './reveal-request';
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
	ActionTypes.REQUEST_BODY_FILE_CHANGED,
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

export default function* projectSaga() {
	yield all([
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery(nodeUpdateWatcherActions, catchNodeUpdates);
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
		fork(function* moveNodeOnDiskWatcher() {
			yield takeLatest(ActionTypes.MOVE_NODE_ON_DISK, moveNodeOnDisk);
		}),
		fork(function* nodeRenameWatcher() {
			yield takeLatest(ActionTypes.RENAME_SUBMITTED, nodeRename);
		}),
		fork(function* revealRequestExternalWatcher() {
			yield takeEvery(ActionTypes.REVEAL_REQUEST_EXTERNAL, revealRequest);
		}),
		fork(function* startProjectWatcher() {
			yield takeEvery(ActionTypes.START_PROJECT, startProject);
		}),
	]);
}
