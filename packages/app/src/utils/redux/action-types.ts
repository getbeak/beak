import { Action } from '@reduxjs/toolkit';

export interface TypedActionCreator {
	(...args: any[]): Action<string>;
	type: string;
}

export function createAsyncActionTypes(actionType: string) {
	return {
		main: actionType,
		success: `${actionType}_SUCCESS`,
		failure: `${actionType}_FAILURE`,
	};
}
