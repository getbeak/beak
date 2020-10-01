import { put } from 'redux-saga/effects';
import { PayloadAction } from 'typesafe-actions';

import { reportNodeUpdate } from '../actions';

interface Interop {
	requestId: string;
}

export default function* catchNodeUpdatesWorker({ payload }: PayloadAction<string, Interop>) {
	const { requestId } = payload;

	yield put(reportNodeUpdate(requestId));
}
