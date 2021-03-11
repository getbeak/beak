import { removeVariableGroup, writeVariableGroup } from '@beak/app/lib/beak-variable-group';
import { VariableGroups } from '@beak/common/dist/types/beak-project';
import { TypedObject } from '@beak/common/helpers/typescript';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
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

	yield call(writeVariableGroups, variableGroupsPath, variableGroups);
}

async function writeVariableGroups(path: string, vgs: VariableGroups) {
	await Promise.all(TypedObject.keys(vgs).map(name => writeVariableGroup(name, vgs[name], path)));
}
