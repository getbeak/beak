import { getProjectSingleton } from '@beak/common/beak-project';
import { ListenerEvent } from '@beak/common/beak-project/project';
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
