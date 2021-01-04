import { all, fork, takeEvery, takeLatest } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchNodeUpdates from './catch-node-updates';
import duplicateRequest from './duplicate-request';
import initialScanComplete from './initial-scan-complete';
import requestRename from './request-rename';
import startProject from './start-project';

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
			yield takeEvery(updateWatcherActions, catchNodeUpdates);
		}),
		fork(function* duplicateRequestWatcher() {
			yield takeLatest(ActionTypes.DUPLICATE_REQUEST, duplicateRequest);
		}),
		fork(function* initialScanCompleteWatcher() {
			yield takeLatest(ActionTypes.INITIAL_SCAN_COMPLETE, initialScanComplete);
		}),
		fork(function* startProjectWatcher() {
			yield takeEvery(ActionTypes.START_PROJECT, startProject);
		}),
		fork(function* requestRenameWatcher() {
			yield takeLatest(ActionTypes.REQUEST_RENAME_SUBMITTED, requestRename);
		}),
	]);
}
