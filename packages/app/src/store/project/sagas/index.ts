import { all, fork, takeEvery, takeLatest } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchNodeUpdatesWorker from './catch-node-updates';
import openProjectWorker from './open-project';
import reportNodeUpdateWorker from './report-node-update';
import startFsListener from './start-fs-listener';

const updateWatcherActions = [
	ActionTypes.REQUEST_URI_UPDATED,
	ActionTypes.REQUEST_QUERY_ADDED,
	ActionTypes.REQUEST_QUERY_UPDATED,
	ActionTypes.REQUEST_QUERY_REMOVED,
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
	]);
}
