import { all, fork, takeEvery, takeLatest } from '@redux-saga/core/effects';

import { ActionTypes } from '../types';
import catchUpdates from './catch-updates';
import createNewVariableGroup from './create-variable-group';
import removeVariableGroupFromDisk from './remove-node-from-disk';
import startVariableGroups from './start-variable-groups';
import variableGroupRename from './variable-group-rename';

const updateWatcherActions = [
	ActionTypes.INSERT_NEW_VARIABLE_GROUP,
	ActionTypes.INSERT_NEW_GROUP,
	ActionTypes.INSERT_NEW_ITEM,
	ActionTypes.UPDATE_GROUP_NAME,
	ActionTypes.UPDATE_ITEM_NAME,
	ActionTypes.UPDATE_VALUE,
	ActionTypes.REMOVE_GROUP,
	ActionTypes.REMOVE_ITEM,
];

export default function* variableGroupsSaga() {
	yield all([
		fork(function* startVariableGroupsWatcher() {
			yield takeEvery(ActionTypes.START_VARIABLE_GROUPS, startVariableGroups);
		}),
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery(updateWatcherActions, catchUpdates);
		}),
		fork(function* createVariableGroupWatcher() {
			yield takeEvery(ActionTypes.CREATE_NEW_VARIABLE_GROUP, createNewVariableGroup);
		}),
		fork(function* variableGroupRenameWatcher() {
			yield takeLatest(ActionTypes.RENAME_SUBMITTED, variableGroupRename);
		}),
		fork(function* removeVariableGroupFromDiskWatcher() {
			yield takeEvery(ActionTypes.REMOVE_VARIABLE_GROUP_FROM_DISK, removeVariableGroupFromDisk);
		}),
	]);
}
