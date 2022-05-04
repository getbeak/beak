import { writeRequestNode } from '@beak/app/lib/beak-project/request';
import type { Nodes, RequestNode } from '@getbeak/types/nodes';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, delay, put, select } from 'redux-saga/effects';
import * as uuid from 'uuid';

import { ApplicationState } from '../..';
import actions from '../actions';
import { RequestIdPayload } from '../types';

export default function* catchNodeUpdatesWorker({ payload }: PayloadAction<RequestIdPayload>) {
	const { requestId } = payload;

	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree[requestId]);

	if (!node || node.type !== 'request')
		return;

	const nonce = uuid.v4();

	yield put(actions.setWriteDebounce({ requestId, nonce }));
	yield delay(500); // 0.5 seconds

	const debounce: string = yield select((s: ApplicationState) => s.global.project.writeDebouncer[requestId]);

	// This prevents us writing the file too often while data is changing
	if (debounce !== nonce)
		return;

	yield put(actions.setLatestWrite({ filePath: node.filePath, writtenAt: Date.now() }));
	yield call(writeRequestNode, node as RequestNode);
}
