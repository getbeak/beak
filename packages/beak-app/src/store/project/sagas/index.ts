import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import openProjectWorker from './open-project';

export default function* projectSaga() {
	yield all([
		fork(function* openProjectWatcher() {
			yield takeEvery(ActionTypes.OPEN_PROJECT, openProjectWorker);
		}),
	]);
}
