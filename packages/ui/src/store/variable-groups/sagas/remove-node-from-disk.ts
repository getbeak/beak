/* eslint-disable max-len */

import { ShowMessageBoxRes } from '@beak/common/ipc/dialog';
import { attemptReconciliation } from '@beak/ui/features/tabs/store/actions';
import { removeVariableGroup } from '@beak/ui/lib/beak-variable-group';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import { call, put } from '@redux-saga/core/effects';
import { PayloadAction } from '@reduxjs/toolkit';

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
