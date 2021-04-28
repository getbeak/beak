import { createTakeLatestSagaSet } from '@beak/app/utils/redux/sagas';
import { eventChannel } from 'redux-saga';
import { call, delay, getContext, take } from 'redux-saga/effects';

import { actions } from '..';

const { ipcRenderer } = window.require('electron');

const intervalLower = 900; // 15 minutes
const intervalUpper = 2700; // 45 minutes

export default createTakeLatestSagaSet(actions.startGuardian, function* startGuardianWorker() {
	const channel = eventChannel(emitter => {
		ipcRenderer.on('arbiter_broadcast', (_event, args) => {
			emitter(args);
		});

		return () => { /* */ };
	});

	while (true) {
		const result: Event = yield take(channel);

		if (result === null)
			break;

		console.log(result);
	}

	// TODO(afr): Listen to changes on the arbiter channel
});

function randomInclusiveNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
