import { all } from 'redux-saga/effects';

import handleMagicLinkWorker from './handle-magic-link';
import sendMagicLinkWorker from './send-magic-link';

export default function* nestSaga() {
	yield all([
		handleMagicLinkWorker,
		sendMagicLinkWorker,
	]);
}
