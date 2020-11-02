import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import openVariableGroupsWorker from './open-variable-groups';

export default function* variableGroupsSaga() {
	yield all([
		fork(function* openVariableGroupsWatcher() {
			yield takeEvery(ActionTypes.OPEN_VARIABLE_GROUPS, openVariableGroupsWorker);
		}),
	]);
}
