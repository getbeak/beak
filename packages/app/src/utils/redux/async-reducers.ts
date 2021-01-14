import { AsyncMapState, AsyncState, MetaPayloadAction } from '@beak/app/store/types';
import Squawk from '@beak/common/utils/squawk';
import { PayloadAction } from '@reduxjs/toolkit';
import { Reducer } from 'redux';

import { createAsyncActionTypes } from './action-types';

export function createAsyncReducer<R = void>(
	actionType: string,
	initialState: AsyncState<R>,
): Reducer<AsyncState<R>, PayloadAction<R | Squawk>> {
	const { request, reset, success, failure } = createAsyncActionTypes(actionType);

	return function asyncReducer(
		state = initialState,
		{ type, payload },
	) {
		switch (type) {
			case request:
				return {
					...state,
					fetching: true,
				};

			case reset:
				return { fetching: false } as AsyncState<R>;

			case success:
				return {
					fetching: false,
					response: payload as R,
				} as AsyncState<R>;

			case failure:
				return {
					fetching: false,
					error: payload,
				} as AsyncState<R>;

			default:
				return state;
		}
	};
}

export default function createAsyncMapReducer<R = void>(
	actionType: string,
	initialState: AsyncMapState<R>,
): Reducer<AsyncMapState<R>, MetaPayloadAction<R | Squawk>> {
	const { request, reset, success, failure } = createAsyncActionTypes(actionType);

	return function asyncMapReducer(
		state = initialState,
		{ type, payload, meta },
	): AsyncMapState<R> {
		switch (type) {
			case request:
				return {
					...state,
					[meta.ident]: {
						...state[meta.ident],
						fetching: true,
					},
				};

			case reset:
				return {
					...state,
					[meta.ident]: { fetching: false } as AsyncState<R>,
				};

			case success:
				return {
					...state,
					[meta.ident]: {
						fetching: false,
						response: payload as R,
					} as AsyncState<R>,
				};

			case failure:
				return {
					...state,
					[meta.ident]: {
						fetching: false,
						error: payload,
					} as AsyncState<R>,
				};

			default:
				return state;
		}
	};
}
