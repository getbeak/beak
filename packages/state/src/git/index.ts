import { createAction, createReducer } from '@reduxjs/toolkit';

export interface Branch {
	name: string;
}

export interface GitState {
	branches: Branch[];
	selectedBranch: string | undefined;
}

export const initialGitState: GitState = {
	branches: [],
	selectedBranch: void 0,
};

export interface GitOpenedPayload {
	branches: Branch[];
	selectedBranch: string | undefined;
}

export const startGit = createAction('git/startGit');
export const gitOpened = createAction<GitOpenedPayload>('git/gitOpened');
export const addBranch = createAction<string>('git/addBranch');
export const removeBranch = createAction<string>('git/removeBranch');
export const changeSelectedBranch = createAction<string | undefined>('git/changeSelectedBranch');

const gitReducer = createReducer(initialGitState, builder => {
	builder
		.addCase(gitOpened, (state, { payload }) => {
			state.branches = payload.branches;
			state.selectedBranch = payload.selectedBranch;
		})
		.addCase(addBranch, (state, { payload }) => {
			state.branches.push({ name: payload });
		})
		.addCase(removeBranch, (state, { payload }) => {
			state.branches = state.branches.filter(b => b.name !== payload);
		})
		.addCase(changeSelectedBranch, (state, { payload }) => {
			state.selectedBranch = payload;
		});
});

export default gitReducer;
