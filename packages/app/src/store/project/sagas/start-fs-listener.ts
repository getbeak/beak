import { ListenerEvent } from '@beak/app/lib/beak-project';
import { getProjectSingleton } from '@beak/app/lib/beak-project/instance';
import { eventChannel } from 'redux-saga';
import { put, take } from 'redux-saga/effects';

import { refreshNodeState } from '../actions';

export default function* startFsListener() {
	const project = getProjectSingleton();

	const channel = eventChannel(emitter => {
		project.startWatching(emitter);

		return () => { /* */ };
	});

	while (true) {
		const result: ListenerEvent = yield take(channel);

		if (result === null)
			break;

		yield put(refreshNodeState(result.node));
	}
}
