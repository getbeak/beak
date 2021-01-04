import { removeFolderNode } from '@beak/app/lib/beak-project/folder';
import { removeRequestNode } from '@beak/app/lib/beak-project/request';
import { Nodes } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { RemoveNodeFromDiskPayload } from '../types';

const { ipcRenderer } = window.require('electron');

export default function* workerRemoveNodeFromDisk({ payload }: PayloadAction<RemoveNodeFromDiskPayload>) {
	const { requestId, withConfirmation } = payload;
	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree[requestId]);

	if (withConfirmation) {
		const response: number = yield call([ipcRenderer, ipcRenderer.invoke], 'dialog:confirm_body_tab_change');

		if (response !== 0)
			return;
	}

	if (node.type === 'folder')
		yield call(removeFolderNode, node.filePath);
	else if (node.type === 'request')
		yield call(removeRequestNode, node.filePath);

	yield put(actions.removeNodeFromStore(requestId));
}
