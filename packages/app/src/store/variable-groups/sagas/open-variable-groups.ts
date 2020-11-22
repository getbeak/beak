import BeakVariableGroup from '@beak/app/lib/beak-variable-group';
import { setVariableGroupSingleton } from '@beak/app/lib/beak-variable-group/instance';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { VariableGroups } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put } from 'redux-saga/effects';

import * as actions from '../actions';

export default function* workerOpenVariableGroups({ payload }: PayloadAction<string>) {
	const projectPath = payload;
	const variableGroup = new BeakVariableGroup(projectPath);

	setVariableGroupSingleton(variableGroup);

	const variableGroups: VariableGroups = yield call([variableGroup, variableGroup.load]);
	const selectedGroups: Record<string, string> = TypedObject
		.keys(variableGroups)
		.reduce((acc, val) => ({
			...acc,
			[val]: TypedObject.keys(variableGroups[val].groups)[0] || void 0,
		}), {});

	yield put(actions.startFsListener());
	yield put(actions.variableGroupsOpened({ variableGroups, selectedGroups }));
}
