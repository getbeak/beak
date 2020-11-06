import BeakVariableGroup from '@beak/app/lib/beak-variable-group';
import { setVariableGroupSingleton } from '@beak/app/lib/beak-variable-group/instance';
import { VariableGroups } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put } from 'redux-saga/effects';

import * as actions from '../actions';

export default function* workerOpenVariableGroups({ payload }: PayloadAction<string>) {
	const projectPath = payload;
	const variableGroup = new BeakVariableGroup(projectPath);

	setVariableGroupSingleton(variableGroup);

	const variableGroups: VariableGroups = yield call([variableGroup, variableGroup.load]);

	yield put(actions.variableGroupsOpened(variableGroups));
}
