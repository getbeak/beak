import { duplicateRequestNode } from '@beak/app/lib/beak-project/request';
import { Nodes } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, delay, put, race, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { ActionTypes, DuplicateRequestPayload } from '../types';

export default function* workerDuplicateRequest({ payload }: PayloadAction<DuplicateRequestPayload>) {
	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree[payload.requestId]);

	if (!node || node.type !== 'request')
		return;

	const newNodeId: string = yield call(duplicateRequestNode, node);

	yield race([
		delay(250),
		take(ActionTypes.INSERT_REQUEST_NODE),
	]);

	yield put(actions.tabSelected({
		type: 'request',
		payload: newNodeId,
		temporary: true,
	}));
}
