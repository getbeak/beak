import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { createVariableGroup } from '@beak/ui/lib/beak-project/variable-groups';
import { call, delay, put, race, take } from '@redux-saga/core/effects';
import { PayloadAction } from '@reduxjs/toolkit';

import { renameStarted } from '../actions';
import { ActionTypes, CreateNewVariableGroupPayload } from '../types';

export default function* workerCreateNewVariableGroup({ payload }: PayloadAction<CreateNewVariableGroupPayload>) {
	const id: string = yield call(createVariableGroup, 'variable-groups', payload.name);

	yield put(changeTab({ type: 'variable_group_editor', payload: id, temporary: true }));
	yield race([
		take(ActionTypes.INSERT_NEW_VARIABLE_GROUP),
		delay(250),
	]);
	yield put(renameStarted({ id }));
}
