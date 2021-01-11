import NestClient from '@beak/app/lib/nest-client';
import { createTakeLatestSagaSet } from '@beak/app/utils/redux/sagas';
import { call, delay, getContext } from 'redux-saga/effects';

import { actions } from '..';

const intervalLower = 900; // 15 minutes
const intervalUpper = 2700; // 45 minutes

export default createTakeLatestSagaSet(actions.startGuardian, function* startGuardianWorker() {
	const client: NestClient = yield getContext('client');

	while (true) {
		try {
			yield call([client, client.ensureAlphaUser]);
			yield delay(randomInclusiveNumber(intervalLower, intervalUpper));
		} catch (error) {
			// TODO(afr): Catch errors, sign out, change window
			console.error(error);
		}
	}
});

function randomInclusiveNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
