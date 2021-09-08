createReducer/* eslint-disable no-param-reassign */

import { TypedObject } from '@beak/common/helpers/typescript';
import { AnyAction, createReducer } from '@reduxjs/toolkit';

function matcher(action: AnyAction, type: string) {
	return action.type === type;
}

// export function createAsyncMapReducer(initialState: unknown, actionType: string) {
// 	return createReducer(initialState, builder => {
// 		builder
// 			.addMatcher(
// 				action => action.type === actionType,
// 				(state, action) => {

// 			});
// 	});
// }
