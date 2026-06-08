// auto-stage
export { autoStageAll } from './auto-stage';

// operations
export type { CommitResult, InitResult, PushResult } from './operations';
export {
	gitCheckout,
	gitCommit,
	gitCreateBranch,
	gitFetch,
	gitFetchStatus,
	gitInit,
	gitListRemotes,
	gitPull,
	gitPush,
} from './operations';

// status-decode
export { decodeStatusMatrix } from './status-decode';
