import { changeTab } from '@beak/app/features/tabs/store/actions';
import { ActiveRename } from '@beak/app/features/tree-view/types';
import { renameFolderNode } from '@beak/app/lib/beak-project/folder';
import { renameRequestNode } from '@beak/app/lib/beak-project/request';
import { ipcDialogService } from '@beak/app/lib/ipc';
import type { FolderNode, Nodes, RequestNode } from '@getbeak/types/nodes';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, delay, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { RequestRenameSubmitted } from '../types';

export default function* workerRequestRename({ payload }: PayloadAction<RequestRenameSubmitted>) {
	const activeRename: ActiveRename = yield select((s: ApplicationState) => s.global.project.activeRename);
	const node: Nodes = yield select((s: ApplicationState) => s.global.project.tree![payload.requestId]);

	if (!activeRename || activeRename.id !== payload.requestId)
		return;

	if (activeRename.name === node.name) {
		yield put(actions.renameResolved({ requestId: payload.requestId }));

		return;
	}

	if (node.type === 'request') {
		try {
			yield call(renameRequestNode, activeRename.name, node as RequestNode);
			yield put(actions.renameResolved({ requestId: payload.requestId }));
			yield delay(200);
			yield put(changeTab({ type: 'request', temporary: false, payload: node.id }));
		} catch (error) {
			if (error instanceof Error && error.message === 'Request already exists') {
				yield call([ipcDialogService, ipcDialogService.showMessageBox], {
					title: 'Already exists!',
					message: 'The file name you specified already exists, please try something else.',
					type: 'info',
				});

				return;
			}

			yield call([ipcDialogService, ipcDialogService.showMessageBox], {
				title: 'Rename unsuccessful',
				message: 'There was an unknown error while attempting to rename this file',
				type: 'error',
			});
		}
	} else if (node.type === 'folder') {
		try {
			yield call(renameFolderNode, activeRename.name, node as FolderNode);
			yield put(actions.renameResolved({ requestId: payload.requestId }));
		} catch (error) {
			if (error instanceof Error && error.message === 'Folder already exists') {
				yield call([ipcDialogService, ipcDialogService.showMessageBox], {
					title: 'Already exists!',
					message: 'The folder name you specified already exists, please try something else.',
					type: 'info',
				});

				return;
			}

			yield call([ipcDialogService, ipcDialogService.showMessageBox], {
				title: 'Rename unsuccessful',
				message: 'There was an unknown error while attempting to rename this folder',
				type: 'error',
			});
		}
	}
}
