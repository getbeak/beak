import { createTakeLatestSagaSet } from '@beak/app/utils/redux/sagas';
import { eventChannel } from 'redux-saga';
import { take } from 'redux-saga/effects';

import { actions } from '..';

const { ipcRenderer } = window.require('electron');

export default createTakeLatestSagaSet(actions.startArbiter, function* startArbiterWorker() {
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
});
