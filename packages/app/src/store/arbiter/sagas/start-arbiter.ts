import { ipcArbiterService } from '@beak/app/lib/ipc';
import { createTakeLatestSagaSet } from '@beak/app/utils/redux/sagas';
import { ArbiterStatus } from '@beak/common/types/arbiter';
import { eventChannel } from 'redux-saga';
import { call, put, take } from 'redux-saga/effects';

import { actions } from '..';

const { ipcRenderer } = window.require('electron');

interface Transport {
	code: string;
	payload: ArbiterStatus;
}

export default createTakeLatestSagaSet(actions.startArbiter, function* startArbiterWorker() {
	const status: ArbiterStatus = yield call([ipcArbiterService, ipcArbiterService.getStatus]);

	yield put(actions.updateStatus(status));

	const channel = eventChannel(emitter => {
		ipcRenderer.on('arbiter_broadcast', (_event, args) => {
			emitter(args);
		});

		return () => { /* */ };
	});

	while (true) {
		const result: Transport = yield take(channel);

		if (result === null)
			break;

		if (result.code !== 'status_update')
			continue;

		yield put(actions.updateStatus(result.payload));
	}
});
