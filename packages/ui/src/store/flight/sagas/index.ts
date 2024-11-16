import { all, fork, takeEvery } from '@redux-saga/core/effects';

import { ActionTypes } from '../types';
import beginFlightWorker from './begin-flight';
import requestFlightWorker from './request-flight';
import requestPureFlightWorker from './request-pure-flight';

export default function* flightSaga() {
	yield all([
		fork(function* requestFlightWatcher() {
			yield takeEvery(ActionTypes.REQUEST_FLIGHT, requestFlightWorker);
			yield takeEvery(ActionTypes.REQUEST_PURE_FLIGHT, requestPureFlightWorker);
			yield takeEvery(ActionTypes.BEGIN_FLIGHT, beginFlightWorker);
		}),
	]);
}
