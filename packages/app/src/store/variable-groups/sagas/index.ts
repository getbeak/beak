import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import catchUpdates from './catch-updates';
import startVariableGroups from './start-variable-groups';

const updateWatcherActions = [
	ActionTypes.UPDATE_GROUP_NAME,
	ActionTypes.UPDATE_ITEM_NAME,
	ActionTypes.UPDATE_VALUE,
	ActionTypes.INSERT_NEW_VARIABLE_GROUP,
	ActionTypes.INSERT_NEW_GROUP,
	ActionTypes.INSERT_NEW_ITEM,
	ActionTypes.REMOVE_GROUP,
	ActionTypes.REMOVE_ITEM,
	ActionTypes.REMOVE_VG,
];

export default function* variableGroupsSaga() {
	yield all([
		fork(function* startVariableGroupsWatcher() {
			yield takeEvery(ActionTypes.START_VARIABLE_GROUPS, startVariableGroups);
		}),
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery(updateWatcherActions, catchUpdates);
		}),
	]);
}
