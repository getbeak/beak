// Source of truth is @beak/core/git.
import { type Branch, type GitOpenedPayload, type GitState, initialGitState } from '@beak/core/git';

export type State = GitState;
export const initialState: State = initialGitState;

export type { Branch, GitOpenedPayload };

export default { initialState };
