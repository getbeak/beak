import { createTakeLatestSagaSet } from '@beak/app/utils/redux/sagas';
import { call, delay, getContext } from 'redux-saga/effects';

import { actions } from '..';

const intervalLower = 900; // 15 minutes
const intervalUpper = 2700; // 45 minutes

export default createTakeLatestSagaSet(actions.startGuardian, function* startGuardianWorker() {
	// TODO(afr): Listen to changes on the arbiter channel
});

function randomInclusiveNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
