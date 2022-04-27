import { changeTab } from '@beak/app-beak/features/tabs/store/actions';
import { createVariableGroup } from '@beak/app-beak/lib/beak-project/variable-groups';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put } from 'redux-saga/effects';

import { CreateNewVariableGroupPayload } from '../types';

export default function* workerCreateNewVariableGroup({ payload }: PayloadAction<CreateNewVariableGroupPayload>) {
	const id: string = yield call(createVariableGroup, 'variable-groups', payload.name);

	yield put(changeTab({ type: 'variable_group_editor', payload: id, temporary: true }));
}
