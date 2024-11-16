import ksuid from '@beak/ksuid';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import { put, select } from '@redux-saga/core/effects';
import { PayloadAction } from '@reduxjs/toolkit';

import { ApplicationState } from '../..';
import * as actions from '../actions';
import { RequestPureFlightPayload } from '../types';

export default function* requestPureFlightWorker({ payload }: PayloadAction<RequestPureFlightPayload>) {
	const {
		flightId: requestedFlightId,
		reason,
		referenceRequestId,
		request,
		showProgress,
		showResult,
	} = payload;

	const binaryStoreKey = ksuid.generate('binstore').toString();
	const flightId = requestedFlightId ?? ksuid.generate('flight').toString();

	const node: ValidRequestNode = yield select((s: ApplicationState) => s.global.project.tree![referenceRequestId]);

	if (!node)
		return;

	yield put(actions.beginFlightRequest({
		binaryStoreKey,
		requestId: referenceRequestId,
		flightId,
		request,
		redirectDepth: 0,

		reason,
		showProgress: Boolean(showProgress),
		showResult: typeof showResult === 'string' ? showResult : Boolean(showResult),
	}));
}
