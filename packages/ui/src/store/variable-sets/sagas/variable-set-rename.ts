import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { ActiveRename } from '@beak/ui/features/tree-view/types';
import { renameVariableSet } from '@beak/ui/lib/beak-project/variable-sets';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import { call, delay, put, select } from '@redux-saga/core/effects';
import { PayloadAction } from '@reduxjs/toolkit';

import { ApplicationState } from '../..';
import actions from '../actions';
import { VariableSetRenameSubmitted } from '../types';

export default function* workerRequestRename({ payload }: PayloadAction<VariableSetRenameSubmitted>) {
	const activeRename: ActiveRename = yield select((s: ApplicationState) => s.global.variableSets.activeRename);
	const { id } = payload;

	if (!activeRename || activeRename.id !== id)
		return;

	if (activeRename.name === activeRename.id) {
		yield put(actions.renameResolved({ id }));

		return;
	}

	try {
		yield call(renameVariableSet, id, activeRename.name);
		yield put(actions.renameResolved({ id }));
		yield delay(200);
		yield put(changeTab({ type: 'variable_set_editor', temporary: false, payload: activeRename.name }));
	} catch (error) {
		if (error instanceof Error && error.message === 'Folder already exists') {
			yield call([ipcDialogService, ipcDialogService.showMessageBox], {
				title: 'Already exists!',
				message: 'The variable set name you specified already exists, please try something else.',
				type: 'info',
			});

			return;
		}

		yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			title: 'Rename unsuccessful',
			message: 'There was an unknown error while attempting to rename this variable set',
			type: 'error',
		});
	}
}
