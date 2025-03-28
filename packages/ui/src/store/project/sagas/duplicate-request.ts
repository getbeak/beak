import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { duplicateRequestNode } from '@beak/ui/lib/beak-project/request';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import type { Nodes } from '@getbeak/types/nodes';
import { call, delay, put, race, select, take } from '@redux-saga/core/effects';
import { PayloadAction } from '@reduxjs/toolkit';

import { ApplicationState } from '../..';
import { ActionTypes, DuplicateRequestPayload } from '../types';

export default function* workerDuplicateRequest({ payload }: PayloadAction<DuplicateRequestPayload>) {
	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree[payload.requestId]);

	if (!node || node.type !== 'request')
		return;

	const newNodeId: string | null = yield call(duplicateRequestNode, node);

	if (!newNodeId) {
		yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			type: 'error',
			title: 'Unable to duplicate broken request',
			message: 'You can\'t duplicate a request which has validation errors. Once they are fixed please try again',
			detail: 'Message @beakapp on twitter for support.',
		});

		return;
	}

	yield race([
		delay(250),
		take(ActionTypes.INSERT_REQUEST_NODE),
	]);

	yield put(changeTab({
		type: 'request',
		payload: newNodeId,
		temporary: true,
	}));
}
