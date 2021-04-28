import { all } from 'redux-saga/effects';

import startArbiterWorker from './start-arbiter';

export default function* nestSaga() {
	yield all([
		startArbiterWorker,
	]);
}
