import { changeTab } from '@beak/app-beak/features/tabs/store/actions';
import { ActiveRename } from '@beak/app-beak/features/tree-view/types';
import { renameVariableGroup } from '@beak/app-beak/lib/beak-project/variable-groups';
import { ipcDialogService } from '@beak/app-beak/lib/ipc';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, delay, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import actions from '../actions';
import { VariableGroupRenameSubmitted } from '../types';

export default function* workerRequestRename({ payload }: PayloadAction<VariableGroupRenameSubmitted>) {
	const activeRename: ActiveRename = yield select((s: ApplicationState) => s.global.variableGroups.activeRename);
	const { id } = payload;

	if (!activeRename || activeRename.id !== id)
		return;

	if (activeRename.name === activeRename.id) {
		yield put(actions.renameResolved({ id }));

		return;
	}

	try {
		yield call(renameVariableGroup, id, activeRename.name);
		yield put(actions.renameResolved({ id }));
		yield delay(200);
		yield put(changeTab({ type: 'variable_group_editor', temporary: false, payload: activeRename.name }));
	} catch (error) {
		if (error instanceof Error && error.message === 'Folder already exists') {
			yield call([ipcDialogService, ipcDialogService.showMessageBox], {
				title: 'Already exists!',
				message: 'The variable group name you specified already exists, please try something else.',
				type: 'info',
			});

			return;
		}

		yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			title: 'Rename unsuccessful',
			message: 'There was an unknown error while attempting to rename this variable group',
			type: 'error',
		});
	}
}
