import NestClient from '@beak/app/lib/nest-client';
import { createTakeLatestSagaSet } from '@beak/app/utils/redux/sagas';
import { call, delay, getContext } from 'redux-saga/effects';

import { actions } from '..';

const intervalLower = 900; // 15 minutes
const intervalUpper = 2700; // 45 minutes

export default createTakeLatestSagaSet(actions.startGuardian, function* startGuardianWorker() {
	const client: NestClient = yield getContext('client');

	let first = false;

	while (true) {
		if (!first)
			yield delay(randomInclusiveNumber(intervalLower, intervalUpper) * 1000);

		try {
			yield call([client, client.ensureAlphaUser]);
		} catch (error) {
			// TODO(afr): Catch errors, sign out, change window
			console.error(error);
		}

		first = true;
	}
});

function randomInclusiveNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
