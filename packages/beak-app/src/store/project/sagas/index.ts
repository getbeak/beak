import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import openProject from './open-project';

export default function* authSaga() {
	yield all([
		fork(function* openProjectWatcher() {
			yield takeEvery(ActionTypes.OPEN_PROJECT, openProject);
		}),
	]);
}
