import { ShowMessageBoxRes } from '@beak/common/ipc/dialog';
import { attemptReconciliation } from '@beak/ui/features/tabs/store/actions';
import { removeVariableSet } from '@beak/ui/lib/beak-variable-set';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import { call, put } from '@redux-saga/core/effects';
import { PayloadAction } from '@reduxjs/toolkit';

import actions from '../actions';
import { RemoveVariableSetFromDiskPayload } from '../types';

export default function* workerRemoveVariableSetFromDisk({ payload }: PayloadAction<RemoveVariableSetFromDiskPayload>) {
	const { id, withConfirmation } = payload;

	if (withConfirmation) {
		const response: ShowMessageBoxRes = yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			title: 'Deleting variable set',
			message: `You are about to delete '${id}' from your machine. Are you sure you want to continue?`,
			detail: 'This action is irreversible inside Beak!',
			type: 'warning',
			buttons: ['Remove', 'Cancel'],
			defaultId: 0,
		});

		if (response.response === 1)
			return;
	}

	yield call(removeVariableSet, id);
	yield put(actions.removeVariableSetFromStore(id));
	yield put(attemptReconciliation());
}
