import { ListenerEvent } from '@beak/app/lib/beak-project';
import { getVariableGroupSingleton } from '@beak/app/lib/beak-variable-group/instance';
import { VariableGroups } from '@beak/common/dist/types/beak-project';
import { eventChannel } from 'redux-saga';
import { call, put, take } from 'redux-saga/effects';

import { actions } from '..';

export default function* startFsListener() {
	const variableGroup = getVariableGroupSingleton();

	const channel = eventChannel(emitter => {
		variableGroup.startWatching(emitter);

		return () => { /* */ };
	});

	while (true) {
		const result: ListenerEvent = yield take(channel);

		if (result === null)
			break;

		const variableGroups: VariableGroups = yield call([variableGroup, variableGroup.load]);

		yield put(actions.variableGroupsOpened({ variableGroups }));
	}
}
