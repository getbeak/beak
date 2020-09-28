import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchNodeUpdatesWorker from './catch-node-updates';
import openProjectWorker from './open-project';
import reportNodeUpdateWorker from './report-node-update';

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
	]);
}
