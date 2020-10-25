import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import executeCommandWorker from './execute-command';

export default function* contextMenusSaga() {
	yield all([
		fork(function* executeCommandWatcher() {
			yield takeEvery(ActionTypes.EXECUTE_COMMAND, executeCommandWorker);
		}),
	]);
}
