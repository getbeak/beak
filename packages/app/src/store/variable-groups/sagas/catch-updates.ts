import { removeVariableGroup, writeVariableGroup } from '@beak/app/lib/beak-variable-group';
import { VariableGroups } from '@beak/common/dist/types/beak-project';
import { TypedObject } from '@beak/common/helpers/typescript';
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
	const variableGroupsPath: string = yield select(
		(s: ApplicationState) => s.global.variableGroups.variableGroupsPath!,
	);

	if (type === ActionTypes.REMOVE_VG) {
		yield call(removeVariableGroup, (payload as string), variableGroupsPath);

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
	yield call(writeVariableGroups, variableGroupsPath, variableGroups);
}

async function writeVariableGroups(path: string, vgs: VariableGroups) {
	await Promise.all(TypedObject.keys(vgs).map(name => writeVariableGroup(name, vgs[name], path)));
}
