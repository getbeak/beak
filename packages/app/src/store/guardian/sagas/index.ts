import { all } from 'redux-saga/effects';

import startGuardianWorker from './start-guardian';

export default function* nestSaga() {
	yield all([
		startGuardianWorker,
	]);
}
