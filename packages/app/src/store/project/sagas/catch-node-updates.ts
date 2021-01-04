import { writeRequestNode } from '@beak/app/lib/beak-project/request';
import { Nodes, RequestNode } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';

interface RequestIdPayload {
	requestId: string;
}

export default function* catchNodeUpdatesWorker({ payload }: PayloadAction<RequestIdPayload>) {
	const { requestId } = payload;

	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree[requestId]);

	if (!node || node.type !== 'request')
		return;

	yield call(writeRequestNode, node as RequestNode);
}
