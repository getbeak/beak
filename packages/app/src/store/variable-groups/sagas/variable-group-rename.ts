import { renameVariableGroup } from '@beak/app/lib/beak-project/variable-groups';
import { ipcDialogService } from '@beak/app/lib/ipc';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { ActiveRename, VariableGroupRenameSubmitted } from '../types';

export default function* workerRequestRename({ payload }: PayloadAction<VariableGroupRenameSubmitted>) {
	const activeRename: ActiveRename = yield select((s: ApplicationState) => s.global.project.activeRename);
	const { variableGroupName } = payload;

	if (activeRename.variableGroupName !== variableGroupName)
		return;

	if (activeRename.updatedName === activeRename.variableGroupName) {
		yield put(actions.renameResolved({ variableGroupName }));

		return;
	}

	try {
		yield call(renameVariableGroup, variableGroupName, activeRename.updatedName);
		yield put(actions.renameResolved({ variableGroupName }));
	} catch (error) {
		if (error instanceof Error && error.message !== 'Variable group already exists')
			throw error;

		yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			title: 'Already exists!',
			message: 'The variable group name you specified already exists, please try something else.',
			type: 'info',
		});
	}
}
