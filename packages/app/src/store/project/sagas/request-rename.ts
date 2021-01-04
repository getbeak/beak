import { renameRequestNode } from '@beak/app/lib/beak-project/request';
import { RequestNode } from '@beak/common/dist/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { ActiveRename, RequestRenameSubmitted } from '../types';

const { dialog } = window.require('electron');

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
		if (error.message !== 'Request name already exists')
			throw error;

		// TODO(afr): Move this out to IPC layer
		dialog.showMessageBox({
			type: 'info',
			title: 'Request name already exists',
			message: 'The request name you entered already exists. Some other name might work though',
		});
	}
}
