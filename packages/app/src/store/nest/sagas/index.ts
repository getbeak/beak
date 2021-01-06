import { all, fork, takeEvery } from 'redux-saga/effects';

import { ActionTypes } from '../types';
import sendMagicLinkWorker from './send-magic-link';

export default function* nestSaga() {
	yield all([
		fork(function* requestFlightWatcher() {
			yield takeEvery(ActionTypes.SEND_MAGIC_LINK, sendMagicLinkWorker);
		}),
	]);
}
