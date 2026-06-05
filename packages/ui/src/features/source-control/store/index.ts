import { createAction, createReducer } from '@reduxjs/toolkit';

export interface State {
	open: boolean;
}

export const initialState: State = {
	open: false,
};

export const openSourceControl = createAction('source-control/open');
export const closeSourceControl = createAction('source-control/close');

export const reducer = createReducer(initialState, builder => {
	builder
		.addCase(openSourceControl, state => {
			state.open = true;
		})
		.addCase(closeSourceControl, state => {
			state.open = false;
		});
});

export default { reducer, openSourceControl, closeSourceControl, initialState };
