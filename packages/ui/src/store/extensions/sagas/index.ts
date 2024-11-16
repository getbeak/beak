import { all, fork, takeEvery } from '@redux-saga/core/effects';

import { ActionTypes } from '../types';
import startExtensions from './start-extensions';

export default function* variableGroupsSaga() {
	yield all([
		fork(function* startExtensionsWatcher() {
			yield takeEvery([
				ActionTypes.START_EXTENSIONS,
				ActionTypes.RELOAD_EXTENSIONS,
			], startExtensions);
		}),
	]);
}
