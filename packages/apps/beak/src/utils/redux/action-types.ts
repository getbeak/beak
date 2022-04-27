import { Action } from '@reduxjs/toolkit';

export interface TypedActionCreator {
	(...args: unknown[]): Action<string>;
	type: string;
}

export function createAsyncActionTypes(actionType: string) {
	return {
		request: actionType,
		reset: `${actionType}_RESET`,
		success: `${actionType}_SUCCESS`,
		failure: `${actionType}_FAILURE`,
	};
}
