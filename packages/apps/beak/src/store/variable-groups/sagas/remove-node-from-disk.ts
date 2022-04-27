/* eslint-disable max-len */

import { attemptReconciliation } from '@beak/app-beak/features/tabs/store/actions';
import { removeVariableGroup } from '@beak/app-beak/lib/beak-variable-group';
import { ipcDialogService } from '@beak/app-beak/lib/ipc';
import { ShowMessageBoxRes } from '@beak/shared-common/ipc/dialog';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put } from 'redux-saga/effects';

import actions from '../actions';
import { RemoveVariableGroupFromDiskPayload } from '../types';

export default function* workerRemoveVariableGroupFromDisk({ payload }: PayloadAction<RemoveVariableGroupFromDiskPayload>) {
	const { id, withConfirmation } = payload;

	if (withConfirmation) {
		const response: ShowMessageBoxRes = yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			title: 'Deleting variable group',
			message: `You are about to delete '${id}' from your machine. Are you sure you want to continue?`,
			detail: 'This action is irreversible inside Beak!',
			type: 'warning',
			buttons: ['Remove', 'Cancel'],
			defaultId: 0,
		});

		if (response.response === 1)
			return;
	}

	yield call(removeVariableGroup, id);
	yield put(actions.removeVariableGroupFromStore(id));
	yield put(attemptReconciliation());
}
