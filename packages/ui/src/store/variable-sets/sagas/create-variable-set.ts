import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { createVariableSet } from '@beak/ui/lib/beak-project/variable-sets';
import { call, delay, put, race, take } from '@redux-saga/core/effects';
import { PayloadAction } from '@reduxjs/toolkit';

import { renameStarted } from '../actions';
import { ActionTypes, CreateNewVariableSetPayload } from '../types';

export default function* workerCreateNewVariableSet({ payload }: PayloadAction<CreateNewVariableSetPayload>) {
	const id: string = yield call(createVariableSet, 'variable-sets', payload.name);

	yield put(changeTab({ type: 'variable_set_editor', payload: id, temporary: true }));
	yield race([
		take(ActionTypes.INSERT_NEW_VARIABLE_GROUP),
		delay(250),
	]);
	yield put(renameStarted({ id }));
}
