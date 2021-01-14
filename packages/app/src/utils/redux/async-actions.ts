import Squawk from '@beak/common/utils/squawk';
import { createAction } from '@reduxjs/toolkit';

import { createAsyncActionTypes } from './action-types';

export function createAsyncMapAction<TReq, TRes = void, TErr = Squawk>(
	actionType: string,
	transform: (payload: TReq) => string,
) {
	const { request, reset, success, failure } = createAsyncActionTypes(actionType);

	return {
		request: createAction(request, (payload: TReq) => ({ payload, meta: { ident: transform(payload) } })),
		reset: createAction(reset, (ident: string) => ({ payload: void 0, meta: { ident } })),
		success: createAction(success, (ident: string, payload: TRes) => ({ payload, meta: { ident } })),
		failure: createAction(failure, (ident: string, payload: TErr) => ({ payload, meta: { ident } })),
	};
}

export function createAsyncAction<TReq, TRes = void, TErr = Squawk>(actionType: string) {
	const { request, reset, success, failure } = createAsyncActionTypes(actionType);

	return {
		request: createAction<TReq>(request),
		reset: createAction(reset),
		success: createAction<TRes>(success),
		failure: createAction<TErr>(failure),
	};
}
