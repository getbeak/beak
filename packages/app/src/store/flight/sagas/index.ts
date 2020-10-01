import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import requestFlightWorker from './request-flight';

export default function* flightSaga() {
	yield all([
		fork(function* requestFlightWatcher() {
			yield takeEvery(ActionTypes.REQUEST_FLIGHT, requestFlightWorker);
		}),
	]);
}
