import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import workerCatchUpdates from './catch-updates';
import openVariableGroupsWorker from './open-variable-groups';
import startFsListener from './start-fs-listener';

const updateWatcherActions = [
	ActionTypes.UPDATE_GROUP_NAME,
	ActionTypes.UPDATE_ITEM_NAME,
	ActionTypes.UPDATE_VALUE,
	ActionTypes.INSERT_NEW_ITEM,
];

export default function* variableGroupsSaga() {
	yield all([
		fork(function* openVariableGroupsWatcher() {
			yield takeEvery(ActionTypes.OPEN_VARIABLE_GROUPS, openVariableGroupsWorker);
		}),
		fork(function* startFsListenerWatcher() {
			yield takeEvery(ActionTypes.START_FS_LISTENER, startFsListener);
		}),
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery(updateWatcherActions, workerCatchUpdates);
		}),
	]);
}
