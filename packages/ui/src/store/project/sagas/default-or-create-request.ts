import { changeTab } from '@beak/ui/features/tabs/store/actions';
import type { Nodes } from '@getbeak/types/nodes';
import { put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { createNewRequest } from '../actions';

export default function* workerDefaultOrCreateRequest() {
	const nodes: Nodes[] = yield select((s: ApplicationState) => Object.values(s.global.project.tree));
	const request = nodes.find(n => n.type === 'request');

	if (request) {
		yield put(changeTab({ type: 'request', temporary: false, payload: request.id }));

		return;
	}

	yield put(createNewRequest({ highlightedNodeId: void 0, name: 'New request' }));
}
