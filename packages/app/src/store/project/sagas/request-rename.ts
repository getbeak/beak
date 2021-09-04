import { renameRequestNode } from '@beak/app/lib/beak-project/request';
import { ipcDialogService } from '@beak/app/lib/ipc';
import { RequestNode } from '@beak/common/dist/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { ActiveRename, RequestRenameSubmitted } from '../types';

export default function* workerRequestRename({ payload }: PayloadAction<RequestRenameSubmitted>) {
	const activeRename: ActiveRename = yield select((s: ApplicationState) => s.global.project.activeRename);
	const node: RequestNode = yield select((s: ApplicationState) => s.global.project.tree![payload.requestId]);

	if (activeRename.requestId !== payload.requestId)
		return;

	if (activeRename.name === node.name) {
		yield put(actions.requestRenameResolved({ requestId: payload.requestId }));

		return;
	}

	try {
		yield call(renameRequestNode, activeRename.name, node);
		yield put(actions.requestRenameResolved({ requestId: payload.requestId }));
	} catch (error) {
		if (error instanceof Error && error.message !== 'Request name already exists')
			throw error;

		yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			title: 'Already exists!',
			message: 'The request name you specified already exists, please try something else.',
			type: 'info',
		});
	}
}
