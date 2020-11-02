import BeakVariableGroup from '@beak/app/lib/beak-variable-group';
import { VariableGroups } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put } from 'redux-saga/effects';

import * as actions from '../actions';

export default function* workerOpenVariableGroups({ payload }: PayloadAction<string>) {
	const projectPath = payload;
	const project = new BeakVariableGroup(projectPath);

	const variableGroups: VariableGroups = yield call([project, project.load]);

	yield put(actions.variableGroupsOpened(variableGroups));
}
