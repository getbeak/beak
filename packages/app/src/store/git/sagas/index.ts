import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import startGit from './start-git';

export default function* variableGroupsSaga() {
	yield all([
		fork(function* startGitWatcher() {
			yield takeEvery(ActionTypes.START_GIT, startGit);
		}),
	]);
}
