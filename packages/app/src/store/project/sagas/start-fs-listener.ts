import { ListenerEvent } from '@beak/app/lib/beak-project';
import { getProjectSingleton } from '@beak/app/lib/beak-project/instance';
import { eventChannel } from 'redux-saga';
import { put, take } from 'redux-saga/effects';

import { insertRequestNode, refreshNodeState } from '../actions';

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

		switch (result.type) {
			case 'change':
				yield put(refreshNodeState(result.node));

				break;

			case 'add':
				yield put(insertRequestNode(result.node));

				break;

			default: break;
		}
	}
}
