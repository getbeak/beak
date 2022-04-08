import { attemptReconciliation } from '@beak/app/features/tabs/store/actions';
import { removeVariableGroup, writeVariableGroup } from '@beak/app/lib/beak-variable-group';
import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableGroups } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, delay, put, select } from 'redux-saga/effects';
import * as uuid from 'uuid';

import { ApplicationState } from '../..';
import { actions } from '..';
import { ActionTypes } from '../types';

export default function* workerCatchUpdates({ type, payload }: PayloadAction<unknown>) {
	const variableGroups: VariableGroups = yield select(
		(s: ApplicationState) => s.global.variableGroups.variableGroups,
	);

	if (type === ActionTypes.REMOVE_VG) {
		try {
			yield call(removeVariableGroup, (payload as string));
		} catch { /* Don't care if this fails */ }

		yield put(attemptReconciliation());

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
	yield call(writeVariableGroups, variableGroups);
}

async function writeVariableGroups(vgs: VariableGroups) {
	await Promise.all(TypedObject.keys(vgs).map(name => writeVariableGroup(name, vgs[name])));
}
