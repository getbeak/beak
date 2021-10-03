import { renameFolderNode } from '@beak/app/lib/beak-project/folder';
import { renameRequestNode } from '@beak/app/lib/beak-project/request';
import { ipcDialogService } from '@beak/app/lib/ipc';
import { FolderNode, Nodes, RequestNode } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { ActiveRename, RequestRenameSubmitted } from '../types';

export default function* workerRequestRename({ payload }: PayloadAction<RequestRenameSubmitted>) {
	const activeRename: ActiveRename = yield select((s: ApplicationState) => s.global.project.activeRename);
	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree![payload.requestId]);

	if (activeRename.id !== payload.requestId)
		return;

	if (activeRename.name === node.name) {
		yield put(actions.renameResolved({ requestId: payload.requestId }));

		return;
	}

	if (activeRename.type === 'request') {
		try {
			yield call(renameRequestNode, activeRename.name, node as RequestNode);
			yield put(actions.renameResolved({ requestId: payload.requestId }));
		} catch (error) {
			if (error instanceof Error && error.message !== 'Request already exists')
				throw error;

			yield call([ipcDialogService, ipcDialogService.showMessageBox], {
				title: 'Already exists!',
				message: 'The request name you specified already exists, please try something else.',
				type: 'info',
			});
		}
	} else if (activeRename.type === 'folder') {
		try {
			yield call(renameFolderNode, activeRename.name, node as FolderNode);
			yield put(actions.renameResolved({ requestId: payload.requestId }));
		} catch (error) {
			if (error instanceof Error && error.message !== 'Folder already exists')
				throw error;

			yield call([ipcDialogService, ipcDialogService.showMessageBox], {
				title: 'Already exists!',
				message: 'The folder name you specified already exists, please try something else.',
				type: 'info',
			});
		}
	}
}
