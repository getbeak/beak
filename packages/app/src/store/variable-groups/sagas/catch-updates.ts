import { attemptReconciliation } from '@beak/app/features/tabs/store/actions';
import { removeVariableGroup, writeVariableGroup } from '@beak/app/lib/beak-variable-group';
import { ipcFsService } from '@beak/app/lib/ipc';
import { VariableGroups } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, delay, put, select } from 'redux-saga/effects';
import * as uuid from 'uuid';

import { ApplicationState } from '../..';
import { actions } from '..';
import { ActionTypes } from '../types';

interface CommonPayload {
	variableGroupName: string;
}

export default function* workerCatchUpdates({ type, payload }: PayloadAction<CommonPayload>) {
	const variableGroups: VariableGroups = yield select(
		(s: ApplicationState) => s.global.variableGroups.variableGroups,
	);

	if (type === ActionTypes.REMOVE_VG) {
		try {
			yield call(removeVariableGroup, payload.variableGroupName);
		} catch { /* Don't care if this fails */ }

		yield put(attemptReconciliation());

		return;
	}

	if (type === ActionTypes.INSERT_NEW_VARIABLE_GROUP) {
		yield call(writeVariableGroup, payload.variableGroupName, variableGroups[payload.variableGroupName]);

		return;
	}

	const nonce = uuid.v4();

	yield put(actions.setWriteDebounce(nonce));
	yield delay(500); // 0.5 seconds

	const debounce: string = yield select((s: ApplicationState) => s.global.variableGroups.writeDebouncer);

	// This prevents us writing the file too often while data is changing
	if (debounce !== nonce)
		return;

	yield put(actions.setLatestWrite(Date.now()));

	const exists: boolean = yield call(
		[ipcFsService, ipcFsService.pathExists],
		`variable-groups/${payload.variableGroupName}.json`,
	);

	// If it doesn't exist that means it's been deleted, so we shouldn't write!
	if (!exists)
		return;

	yield call(writeVariableGroup, payload.variableGroupName, variableGroups[payload.variableGroupName]);
}
