import NestClient from '@beak/app/lib/nest-client';
import { createTakeEverySagaSet } from '@beak/app/utils/redux/sagas';
import Squawk from '@beak/common/utils/squawk';
import { call, getContext, put } from 'redux-saga/effects';

import { actions } from '..';

export default createTakeEverySagaSet(actions.sendMagicLink.request, function* sendMagicLinkWorker(action) {
	const client: NestClient = yield getContext('client');
	const { email } = action.payload;

	try {
		yield call([client, client.sendMagicLink], email);
		yield put(actions.sendMagicLink.success());
	} catch (error) {
		yield put(actions.sendMagicLink.failure(Squawk.coerce(error)));
	}
});
