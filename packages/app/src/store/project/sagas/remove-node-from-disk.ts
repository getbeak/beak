import { removeFolderNode } from '@beak/app/lib/beak-project/folder';
import { removeRequestNode } from '@beak/app/lib/beak-project/request';
import { ipcDialogService } from '@beak/app/lib/ipc';
import { TypedObject } from '@beak/common/helpers/typescript';
import { ShowMessageBoxRes } from '@beak/common/ipc/dialog';
import { Nodes, RequestNode, Tree } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, delay, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { RemoveNodeFromDiskPayload } from '../types';

export default function* workerRemoveNodeFromDisk({ payload }: PayloadAction<RemoveNodeFromDiskPayload>) {
	const { requestId, withConfirmation } = payload;
	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree[requestId]);

	if (withConfirmation) {
		const response: ShowMessageBoxRes = yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			title: 'Removal confirmation',
			message: 'Are you sure you want to remove this node?',
			type: 'warning',
			buttons: ['Remove', 'Cancel'],
			defaultId: 1,
			cancelId: 1,
		});

		if (response.response === 1)
			return;
	}

	if (node.type === 'folder')
		yield call(removeFolderNode, node.filePath);
	else if (node.type === 'request')
		yield call(removeRequestNode, node.filePath);

	yield put(actions.removeNodeFromStore(requestId));

	// Wait for FS changes to have happened and to be reported
	// This is for folder deletions, instead of simple request ones
	yield delay(300);

	const selectedTab: string | undefined = yield select((s: ApplicationState) => s.global.project.selectedTabPayload);

	if (!selectedTab)
		return;

	const tree: Tree = yield select((s: ApplicationState) => s.global.project.tree);
	const requests = TypedObject.values(tree).filter(t => t.type === 'request') as RequestNode[];

	if (!requests.find(r => r.id === selectedTab))
		yield put(actions.closeSelectedTab(selectedTab));
}
