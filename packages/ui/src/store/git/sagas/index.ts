import { all, fork, takeEvery } from '@redux-saga/core/effects';

import { ActionTypes } from '../types';
import startGit from './start-git';

export default function* variableSetsSaga() {
	yield all([
		fork(function* startGitWatcher() {
			yield takeEvery(ActionTypes.START_GIT, startGit);
		}),
	]);
}
