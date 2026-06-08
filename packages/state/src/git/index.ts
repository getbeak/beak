import type {
	GitCheckoutRequest,
	GitCommitRequest,
	GitCreateBranchRequest,
	GitFetchRequest,
	GitInitRequest,
	GitPullRequest,
	GitPushRequest,
} from '@beak/common/ipc/git';
import { createAction, createReducer } from '@reduxjs/toolkit';

export type {
	GitCheckoutRequest,
	GitCommitRequest,
	GitCreateBranchRequest,
	GitFetchRequest,
	GitInitRequest,
	GitPullRequest,
	GitPushRequest,
};

export interface Branch {
	name: string;
}

export interface RemoteEntry {
	remote: string;
	url: string;
}

/**
 * One-line summary of a single tracked file's working-tree state. Derived
 * from isomorphic-git's status matrix at the renderer-effect layer.
 */
export interface GitFileStatus {
	filepath: string;
	staged: boolean;
	unstaged: boolean;
	untracked: boolean;
	deleted: boolean;
}

/**
 * Rolled-up status for the Source Control panel. `files` is the full list
 * of non-clean files; counts are pre-computed so the sidebar indicator can
 * render without iterating.
 */
export interface GitStatusSummary {
	staged: number;
	unstaged: number;
	untracked: number;
	files: GitFileStatus[];
	updatedAt: string;
}

export type GitOperation = 'init' | 'commit' | 'push' | 'pull' | 'fetch' | 'checkout' | 'branch';

export type GitOperationState =
	| { phase: 'idle' }
	| { phase: 'pending'; op: GitOperation }
	| { phase: 'success'; op: GitOperation; notice?: string; at: string }
	| { phase: 'error'; op: GitOperation; error: string; at: string };

export interface GitState {
	/**
	 * True once the project is known to be a git repo (has `.git/HEAD`).
	 * Effects fill this in via `gitOpened`; `gitClosed` resets to false.
	 */
	available: boolean;
	branches: Branch[];
	selectedBranch: string | undefined;
	remotes: RemoteEntry[];
	status: GitStatusSummary | null;
	statusLoading: boolean;
	statusError: string | null;
	operation: GitOperationState;
}

export const initialGitState: GitState = {
	available: false,
	branches: [],
	selectedBranch: void 0,
	remotes: [],
	status: null,
	statusLoading: false,
	statusError: null,
	operation: { phase: 'idle' },
};

export interface GitOpenedPayload {
	branches: Branch[];
	selectedBranch: string | undefined;
}

export const startGit = createAction('git/startGit');
export const gitOpened = createAction<GitOpenedPayload>('git/gitOpened');
export const gitClosed = createAction('git/gitClosed');
export const addBranch = createAction<string>('git/addBranch');
export const removeBranch = createAction<string>('git/removeBranch');
export const changeSelectedBranch = createAction<string | undefined>('git/changeSelectedBranch');

export const requestStatus = createAction('git/requestStatus');
export const statusFetched = createAction<GitStatusSummary>('git/statusFetched');
export const statusFailed = createAction<string>('git/statusFailed');
export const remotesUpdated = createAction<RemoteEntry[]>('git/remotesUpdated');

export const requestInit = createAction<GitInitRequest>('git/requestInit');
export const requestCommit = createAction<GitCommitRequest>('git/requestCommit');
export const requestPush = createAction<GitPushRequest>('git/requestPush');
export const requestPull = createAction<GitPullRequest>('git/requestPull');
export const requestFetch = createAction<GitFetchRequest>('git/requestFetch');
export const requestCheckout = createAction<GitCheckoutRequest>('git/requestCheckout');
export const requestCreateBranch = createAction<GitCreateBranchRequest>('git/requestCreateBranch');

export const operationStarted = createAction<{ op: GitOperation }>('git/operationStarted');
export const operationSucceeded = createAction<{ op: GitOperation; notice?: string }>('git/operationSucceeded');
export const operationFailed = createAction<{ op: GitOperation; error: string }>('git/operationFailed');
export const operationDismissed = createAction('git/operationDismissed');

const gitReducer = createReducer(initialGitState, builder => {
	builder
		.addCase(gitOpened, (state, { payload }) => {
			state.available = true;
			state.branches = payload.branches;
			state.selectedBranch = payload.selectedBranch;
		})
		.addCase(gitClosed, state => {
			state.available = false;
			state.branches = [];
			state.selectedBranch = void 0;
			state.remotes = [];
			state.status = null;
			state.statusLoading = false;
			state.statusError = null;
			state.operation = { phase: 'idle' };
		})
		.addCase(addBranch, (state, { payload }) => {
			if (state.branches.some(b => b.name === payload)) return;
			state.branches.push({ name: payload });
		})
		.addCase(removeBranch, (state, { payload }) => {
			state.branches = state.branches.filter(b => b.name !== payload);
		})
		.addCase(changeSelectedBranch, (state, { payload }) => {
			state.selectedBranch = payload;
		})
		.addCase(requestStatus, state => {
			state.statusLoading = true;
			state.statusError = null;
		})
		.addCase(statusFetched, (state, { payload }) => {
			state.status = payload;
			state.statusLoading = false;
			state.statusError = null;
		})
		.addCase(statusFailed, (state, { payload }) => {
			state.statusLoading = false;
			state.statusError = payload;
		})
		.addCase(remotesUpdated, (state, { payload }) => {
			state.remotes = payload;
		})
		.addCase(operationStarted, (state, { payload }) => {
			state.operation = { phase: 'pending', op: payload.op };
		})
		.addCase(operationSucceeded, (state, { payload }) => {
			state.operation = {
				phase: 'success',
				op: payload.op,
				notice: payload.notice,
				at: new Date().toISOString(),
			};
		})
		.addCase(operationFailed, (state, { payload }) => {
			state.operation = {
				phase: 'error',
				op: payload.op,
				error: payload.error,
				at: new Date().toISOString(),
			};
		})
		.addCase(operationDismissed, state => {
			state.operation = { phase: 'idle' };
		});
});

export default gitReducer;
