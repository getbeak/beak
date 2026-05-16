// Source of truth is @beak/state/git.
import {
	type Branch,
	type GitFileStatus,
	type GitOpenedPayload,
	type GitOperation,
	type GitOperationState,
	type GitState,
	type GitStatusSummary,
	type RemoteEntry,
	initialGitState,
} from '@beak/state/git';

export type State = GitState;
export const initialState: State = initialGitState;

export type { Branch, GitFileStatus, GitOpenedPayload, GitOperation, GitOperationState, GitStatusSummary, RemoteEntry };

export default { initialState };
