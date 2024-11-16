import { all } from '@redux-saga/core/effects';

import startArbiterWorker from './start-arbiter';

export default function* nestSaga() {
	yield all([
		startArbiterWorker,
	]);
}
