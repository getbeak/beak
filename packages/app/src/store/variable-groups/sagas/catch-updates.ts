import { writeVariableGroup } from '@beak/app/lib/beak-variable-group';
import { VariableGroups } from '@beak/common/dist/types/beak-project';
import { TypedObject } from '@beak/common/helpers/typescript';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';

export default function* workerCatchUpdates() {
	const variableGroups: VariableGroups = yield select(
		(s: ApplicationState) => s.global.variableGroups.variableGroups,
	);
	const variableGroupsPath: string = yield select(
		(s: ApplicationState) => s.global.variableGroups.variableGroupsPath!,
	);

	yield call(writeVariableGroups, variableGroupsPath, variableGroups);
}

async function writeVariableGroups(path: string, vgs: VariableGroups) {
	await Promise.all(TypedObject.keys(vgs).map(name => writeVariableGroup(name, vgs[name], path)));
}
