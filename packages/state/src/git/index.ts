import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';

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

export interface GitInitRequest {
	defaultBranch?: string;
}

export interface GitCommitRequest {
	message: string;
	author: { name: string; email: string };
	committer?: { name: string; email: string };
}

export interface GitPushRequest {
	remote?: string;
	ref?: string;
	force?: boolean;
	auth?: { username?: string; password?: string };
}

export interface GitPullRequest {
	remote?: string;
	ref?: string;
	fastForwardOnly?: boolean;
	auth?: { username?: string; password?: string };
	author: { name: string; email: string };
}

export interface GitFetchRequest {
	remote?: string;
	ref?: string;
	auth?: { username?: string; password?: string };
}

export interface GitCheckoutRequest {
	ref: string;
	force?: boolean;
}

export interface GitCreateBranchRequest {
	/** New branch name. */
	ref: string;
	/** Optional starting point — defaults to HEAD when omitted. */
	object?: string;
	/** Switch to the new branch after creating it. */
	checkout?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Effect-trigger actions (no state mutation — signal to listener middleware) */
/* -------------------------------------------------------------------------- */

export const startGit = createAction('git/startGit');
export const requestInit = createAction<GitInitRequest>('git/requestInit');
export const requestCommit = createAction<GitCommitRequest>('git/requestCommit');
export const requestPush = createAction<GitPushRequest>('git/requestPush');
export const requestPull = createAction<GitPullRequest>('git/requestPull');
export const requestFetch = createAction<GitFetchRequest>('git/requestFetch');
export const requestCheckout = createAction<GitCheckoutRequest>('git/requestCheckout');
export const requestCreateBranch = createAction<GitCreateBranchRequest>('git/requestCreateBranch');

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const gitSlice = createSlice({
	name: 'git',
	initialState: initialGitState,
	reducers: {
		gitOpened: (state, { payload }: PayloadAction<GitOpenedPayload>) => {
			state.available = true;
			state.branches = payload.branches;
			state.selectedBranch = payload.selectedBranch;
		},
		gitClosed: state => {
			state.available = false;
			state.branches = [];
			state.selectedBranch = void 0;
			state.remotes = [];
			state.status = null;
			state.statusLoading = false;
			state.statusError = null;
			state.operation = { phase: 'idle' };
		},
		addBranch: (state, { payload }: PayloadAction<string>) => {
			if (state.branches.some(b => b.name === payload)) return;
			state.branches.push({ name: payload });
		},
		removeBranch: (state, { payload }: PayloadAction<string>) => {
			state.branches = state.branches.filter(b => b.name !== payload);
		},
		changeSelectedBranch: (state, { payload }: PayloadAction<string | undefined>) => {
			state.selectedBranch = payload;
		},
		requestStatus: state => {
			state.statusLoading = true;
			state.statusError = null;
		},
		statusFetched: (state, { payload }: PayloadAction<GitStatusSummary>) => {
			state.status = payload;
			state.statusLoading = false;
			state.statusError = null;
		},
		statusFailed: (state, { payload }: PayloadAction<string>) => {
			state.statusLoading = false;
			state.statusError = payload;
		},
		remotesUpdated: (state, { payload }: PayloadAction<RemoteEntry[]>) => {
			state.remotes = payload;
		},
		operationStarted: (state, { payload }: PayloadAction<{ op: GitOperation }>) => {
			state.operation = { phase: 'pending', op: payload.op };
		},
		operationSucceeded: (state, { payload }: PayloadAction<{ op: GitOperation; notice?: string }>) => {
			// TODO ADR 0005 §2 — Date.now() / toISOString() side-effect belongs in a listener, not a reducer
			state.operation = {
				phase: 'success',
				op: payload.op,
				notice: payload.notice,
				at: new Date().toISOString(),
			};
		},
		operationFailed: (state, { payload }: PayloadAction<{ op: GitOperation; error: string }>) => {
			// TODO ADR 0005 §2 — Date.now() / toISOString() side-effect belongs in a listener, not a reducer
			state.operation = {
				phase: 'error',
				op: payload.op,
				error: payload.error,
				at: new Date().toISOString(),
			};
		},
		operationDismissed: state => {
			state.operation = { phase: 'idle' };
		},
	},
});

export const {
	gitOpened,
	gitClosed,
	addBranch,
	removeBranch,
	changeSelectedBranch,
	requestStatus,
	statusFetched,
	statusFailed,
	remotesUpdated,
	operationStarted,
	operationSucceeded,
	operationFailed,
	operationDismissed,
} = gitSlice.actions;

export default gitSlice.reducer;

/* -------------------------------------------------------------------------- */
/*  Selectors                                                                 */
/* -------------------------------------------------------------------------- */

export interface GitRootState {
	global: { git: GitState };
}

export function selectGitAvailable(state: GitRootState): boolean {
	return state.global.git.available;
}

export function selectGitBranches(state: GitRootState): Branch[] {
	return state.global.git.branches;
}

export function selectGitSelectedBranch(state: GitRootState): string | undefined {
	return state.global.git.selectedBranch;
}

export function selectGitRemotes(state: GitRootState): RemoteEntry[] {
	return state.global.git.remotes;
}

export function selectGitStatus(state: GitRootState): GitStatusSummary | null {
	return state.global.git.status;
}

export function selectGitStatusLoading(state: GitRootState): boolean {
	return state.global.git.statusLoading;
}

export function selectGitStatusError(state: GitRootState): string | null {
	return state.global.git.statusError;
}

export function selectGitOperation(state: GitRootState): GitOperationState {
	return state.global.git.operation;
}

/** Convenience: true when any git operation is in flight. */
export function selectGitOperationPending(state: GitRootState): boolean {
	return state.global.git.operation.phase === 'pending';
}
