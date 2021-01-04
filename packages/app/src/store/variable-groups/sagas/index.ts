import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchUpdates from './catch-updates';
import initialScanComplete from './initial-scan-complete';
import startVariableGroups from './start-variable-groups';

const updateWatcherActions = [
	ActionTypes.UPDATE_GROUP_NAME,
	ActionTypes.UPDATE_ITEM_NAME,
	ActionTypes.UPDATE_VALUE,
	ActionTypes.INSERT_NEW_ITEM,
];

export default function* variableGroupsSaga() {
	yield all([
		fork(function* startVariableGroupsWatcher() {
			yield takeEvery(ActionTypes.START_VARIABLE_GROUPS, startVariableGroups);
		}),
		fork(function* initialScanCompleteWatcher() {
			yield takeEvery(ActionTypes.INITIAL_SCAN_COMPLETE, initialScanComplete);
		}),
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery(updateWatcherActions, catchUpdates);
		}),
	]);
}
