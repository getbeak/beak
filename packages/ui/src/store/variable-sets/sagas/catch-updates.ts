import { writeVariableSet } from '@beak/ui/lib/beak-variable-set';
import type { VariableSet } from '@getbeak/types/variable-sets';
import { call, delay, put, select } from '@redux-saga/core/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import * as uuid from 'uuid';

import { ApplicationState } from '../..';
import { actions } from '..';
import { VariableSetId } from '../types';

export default function* workerCatchUpdates({ payload }: PayloadAction<VariableSetId>) {
	const { id } = payload;

	const variableSet: VariableSet = yield select(
		(s: ApplicationState) => s.global.variableSets.variableSets[id],
	);

	if (!variableSet)
		return;

	const nonce = uuid.v4();

	yield put(actions.setWriteDebounce(nonce));
	yield delay(500); // 0.5 seconds

	const debounce: string = yield select((s: ApplicationState) => s.global.variableSets.writeDebouncer);

	// This prevents us writing the file too often while data is changing
	if (debounce !== nonce)
		return;

	yield put(actions.setLatestWrite(Date.now()));
	yield call(writeVariableSet, id, variableSet);
}
