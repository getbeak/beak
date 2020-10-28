import { all, fork, takeEvery, takeLatest } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchNodeUpdatesWorker from './catch-node-updates';
import openProjectWorker from './open-project';
import reportNodeUpdateWorker from './report-node-update';
import requestRename from './request-rename';
import startFsListener from './start-fs-listener';

const updateWatcherActions = [
	ActionTypes.REQUEST_URI_UPDATED,
	ActionTypes.REQUEST_QUERY_ADDED,
	ActionTypes.REQUEST_QUERY_UPDATED,
	ActionTypes.REQUEST_QUERY_REMOVED,
	ActionTypes.REQUEST_HEADER_ADDED,
	ActionTypes.REQUEST_HEADER_UPDATED,
	ActionTypes.REQUEST_HEADER_REMOVED,
	ActionTypes.REQUEST_BODY_JSON_CHANGED,
	ActionTypes.REQUEST_BODY_TEXT_CHANGED,
];

export default function* projectSaga() {
	yield all([
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery(updateWatcherActions, catchNodeUpdatesWorker);
		}),
		fork(function* openProjectWatcher() {
			yield takeEvery(ActionTypes.OPEN_PROJECT, openProjectWorker);
		}),
		fork(function* reportNodeUpdateWatcher() {
			yield takeEvery(ActionTypes.REPORT_NODE_UPDATE, reportNodeUpdateWorker);
		}),
		fork(function* startFsListenerWatcher() {
			yield takeLatest(ActionTypes.START_FS_LISTENER, startFsListener);
		}),
		fork(function* requestRenameWatcher() {
			yield takeLatest(ActionTypes.REQUEST_RENAME_SUBMITTED, requestRename);
		}),
	]);
}
