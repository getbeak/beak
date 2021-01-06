import Squawk from '@beak/common/utils/squawk';
import { createAction } from '@reduxjs/toolkit';

import { createAsyncActionTypes } from './action-types';

export function createAsyncMapAction<TReq, TRes = void, TErr = Squawk>(
	actionType: string,
	transform: (payload: TReq) => string,
) {
	const { main, success, failure } = createAsyncActionTypes(actionType);

	return {
		request: createAction(main, (payload: TReq) => ({ payload, meta: { ident: transform(payload) } })),
		success: createAction(success, (ident: string, payload: TRes) => ({ payload, meta: { ident } })),
		failure: createAction(failure, (ident: string, payload: TErr) => ({ payload, meta: { ident } })),
	};
}

export function createAsyncAction<TReq, TRes = void, TErr = Squawk>(actionType: string) {
	const { main, success, failure } = createAsyncActionTypes(actionType);

	return {
		request: createAction<TReq>(main),
		success: createAction<TRes>(success),
		failure: createAction<TErr>(failure),
	};
}
