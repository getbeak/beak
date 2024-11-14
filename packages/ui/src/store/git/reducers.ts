import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const gitReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.gitOpened, (state, { payload }) => {
			state.branches = payload.branches;
			state.selectedBranch = payload.selectedBranch;
		})

		.addCase(actions.addBranch, (state, { payload }) => {
			state.branches.push({ name: payload });
		})
		.addCase(actions.removeBranch, (state, { payload }) => {
			state.branches = state.branches.filter(b => b.name !== payload);
		})
		.addCase(actions.changeSelectedBranch, (state, { payload }) => {
			state.selectedBranch = payload;
		});
});

export default gitReducer;
