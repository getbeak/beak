import NestClient from '@beak/app/lib/nest-client';
import { createTakeLatestSagaSet } from '@beak/app/utils/redux/sagas';
import { call, delay, getContext } from 'redux-saga/effects';

import { actions } from '..';

const intervalLower = 900; // 15 minutes
const intervalUpper = 2700; // 45 minutes

export default createTakeLatestSagaSet(actions.startGuardian, function* startGuardianWorker(action) {
	const client: NestClient = yield getContext('client');

	while (true) {
		yield delay(randomInclusiveNumber(intervalLower, intervalUpper));

		try {
			yield call([client, client.ensureAlphaUser]);
		} catch (error) {
			console.error(error);
		}
	}
});

function randomInclusiveNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
