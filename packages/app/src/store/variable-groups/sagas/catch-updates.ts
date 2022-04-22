import { writeVariableGroup } from '@beak/app/lib/beak-variable-group';
import { VariableGroup } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, delay, put, select } from 'redux-saga/effects';
import * as uuid from 'uuid';

import { ApplicationState } from '../..';
import { actions } from '..';
import { VariableGroupId } from '../types';

export default function* workerCatchUpdates({ payload }: PayloadAction<VariableGroupId>) {
	const { id } = payload;

	const variableGroup: VariableGroup = yield select(
		(s: ApplicationState) => s.global.variableGroups.variableGroups[id],
	);

	if (!variableGroup)
		return;

	const nonce = uuid.v4();

	yield put(actions.setWriteDebounce(nonce));
	yield delay(500); // 0.5 seconds

	const debounce: string = yield select((s: ApplicationState) => s.global.variableGroups.writeDebouncer);

	// This prevents us writing the file too often while data is changing
	if (debounce !== nonce)
		return;

	yield put(actions.setLatestWrite(Date.now()));
	yield call(writeVariableGroup, id, variableGroup);
}
