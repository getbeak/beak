import { attemptReconciliation } from '@beak/app/features/tabs/store/actions';
import { removeFolderNode } from '@beak/app/lib/beak-project/folder';
import { removeRequestNode } from '@beak/app/lib/beak-project/request';
import { ipcDialogService } from '@beak/app/lib/ipc';
import { ShowMessageBoxRes } from '@beak/common/ipc/dialog';
import { Nodes } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { RemoveNodeFromDiskPayload } from '../types';

export default function* workerRemoveNodeFromDisk({ payload }: PayloadAction<RemoveNodeFromDiskPayload>) {
	const { requestId, withConfirmation } = payload;
	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree[requestId]);

	if (withConfirmation) {
		const response: ShowMessageBoxRes = yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			title: 'Deleting file or folder',
			message: `You are about to delete '${node.name}' from your machine. Are you sure you want to continue?`,
			detail: 'This action is irreversible inside Beak!',
			type: 'warning',
			buttons: ['Remove', 'Cancel'],
			defaultId: 0,
		});

		if (response.response === 1)
			return;
	}

	if (node.type === 'folder')
		yield call(removeFolderNode, node.filePath);
	else if (node.type === 'request')
		yield call(removeRequestNode, node.filePath);

	yield put(actions.removeNodeFromStore(requestId));

	yield put(attemptReconciliation());
}
