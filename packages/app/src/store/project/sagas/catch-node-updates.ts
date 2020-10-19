import { PayloadAction } from '@reduxjs/toolkit';
import { put } from 'redux-saga/effects';

import { reportNodeUpdate } from '../actions';

interface Interop {
	requestId: string;
}

export default function* catchNodeUpdatesWorker({ payload }: PayloadAction<Interop>) {
	const { requestId } = payload;

	yield put(reportNodeUpdate(requestId));
}
