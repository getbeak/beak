import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchNodeUpdatesWorker from './catch-node-updates';
import openProjectWorker from './open-project';
import reportNodeUpdateWorker from './report-node-update';

export default function* projectSaga() {
	yield all([
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery([ActionTypes.REQUEST_URI_UPDATED], catchNodeUpdatesWorker);
		}),
		fork(function* openProjectWatcher() {
			yield takeEvery(ActionTypes.OPEN_PROJECT, openProjectWorker);
		}),
		fork(function* reportNodeUpdateWatcher() {
			yield takeEvery(ActionTypes.REPORT_NODE_UPDATE, reportNodeUpdateWorker);
		}),
	]);
}
