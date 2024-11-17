import { all, fork, takeEvery, takeLatest } from '@redux-saga/core/effects';

import { ActionTypes } from '../types';
import catchUpdates from './catch-updates';
import createNewVariableSet from './create-variable-set';
import removeVariableSetFromDisk from './remove-node-from-disk';
import startVariableSets from './start-variable-sets';
import variableSetRename from './variable-set-rename';

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

export default function* variableSetsSaga() {
	yield all([
		fork(function* startVariableSetsWatcher() {
			yield takeEvery(ActionTypes.START_VARIABLE_GROUPS, startVariableSets);
		}),
		fork(function* catchNodeUpdatesWatcher() {
			yield takeEvery(updateWatcherActions, catchUpdates);
		}),
		fork(function* createVariableSetWatcher() {
			yield takeEvery(ActionTypes.CREATE_NEW_VARIABLE_GROUP, createNewVariableSet);
		}),
		fork(function* variableSetRenameWatcher() {
			yield takeLatest(ActionTypes.RENAME_SUBMITTED, variableSetRename);
		}),
		fork(function* removeVariableSetFromDiskWatcher() {
			yield takeEvery(ActionTypes.REMOVE_VARIABLE_GROUP_FROM_DISK, removeVariableSetFromDisk);
		}),
	]);
}
