import { getVariableGroupSingleton } from '@beak/app/lib/beak-variable-group/instance';
import { VariableGroups } from '@beak/common/dist/types/beak-project';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';

export default function* workerCatchUpdates() {
	const variableGroup = getVariableGroupSingleton();
	const variableGroups: VariableGroups = yield select(
		(s: ApplicationState) => s.global.variableGroups.variableGroups,
	);

	yield call([variableGroup, variableGroup.saveGroups], variableGroups);
}
