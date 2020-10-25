import { ListenerEvent } from '@beak/app/lib/beak-project';
import { getProjectSingleton } from '@beak/app/lib/beak-project/instance';
import { RequestNode } from '@beak/common/dist/types/beak-project';
import { eventChannel } from 'redux-saga';
import { put, take } from 'redux-saga/effects';

import { insertRequestNode, refreshNodeState, removeRequestNode } from '../actions';

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

		if (result.type === 'change')
			yield put(refreshNodeState(result.node as RequestNode));
		else if (result.type === 'add')
			yield put(insertRequestNode(result.node));
		else if (result.type === 'unlink')
			yield put(removeRequestNode(result.path));
	}
}
