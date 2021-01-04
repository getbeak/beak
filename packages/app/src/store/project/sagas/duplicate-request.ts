import { PayloadAction } from '@reduxjs/toolkit';
import { call, put } from 'redux-saga/effects';

import actions from '../actions';
import { DuplicateRequestPayload } from '../types';

export default function* workerDuplicateRequest({ payload }: PayloadAction<DuplicateRequestPayload>) {
	// const project = getProjectSingleton();
	// const newId: string = yield call([project, project.duplicateRequestNode], payload.requestId);

	// yield put(actions.requestSelected(newId));
}
