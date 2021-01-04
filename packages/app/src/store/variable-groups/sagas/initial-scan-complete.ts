import { readVariableGroup } from '@beak/app/lib/beak-variable-group';
import { VariableGroups } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put } from 'redux-saga/effects';

import actions from '../actions';

export default function* workerInitialScanComplete({ payload }: PayloadAction<string[]>) {
	const variableGroups: VariableGroups = yield call(readVariableGroups, payload);

	yield put(actions.variableGroupsOpened(variableGroups));
}

async function readVariableGroups(filePaths: string[]) {
	const results = await Promise.all(filePaths.map(f => readVariableGroup(f)));

	return results.reduce((acc, { name, file }) => ({
		...acc,
		[name]: file,
	}), {});
}
