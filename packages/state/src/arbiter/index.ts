import { createAction, createReducer } from '@reduxjs/toolkit';

export interface ArbiterState {
	status: boolean;
}

export const initialArbiterState: ArbiterState = {
	status: true,
};

export const startArbiter = createAction('arbiter/startArbiter');
export const updateStatus = createAction<boolean>('arbiter/updateStatus');

const arbiterReducer = createReducer(initialArbiterState, builder => {
	builder.addCase(updateStatus, (state, { payload }) => {
		state.status = payload;
	});
});

export default arbiterReducer;
