import Squawk from '@beak/common/utils/squawk';
import {
	type AddReq,
	type AddRemoteReq,
	type BranchReq,
	type CheckoutReq,
	type CloneReq,
	type CommitReq,
	type CurrentBranchReq,
	type FetchReq,
	IpcGitServiceMain,
	type InitReq,
	type ListBranchesReq,
	type ListRemotesReq,
	type LogReq,
	type PullReq,
	type PushReq,
	type RemoveRemoteReq,
	type RemoveReq,
	type ResolveRefReq,
	type StatusMatrixReq,
	type StatusReq,
} from '@beak/common/ipc/git';

import getBeakHost from '../host';
import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

/**
 * Web-side Git handlers — thin pass-through to `Runtime.git` (BeakGit),
 * which is wired with `isomorphic-git/http/web` plus a default CORS proxy
 * for browser-to-Git-host requests. `dir` is a lightning-fs path
 * (typically `/<project-id>`).
 *
 * Every window-bound op pins `dir` to the open project's lightning-fs
 * root. Clone is the one exception — the renderer-supplied `dir` is the
 * destination of the new working tree.
 */
const service = new IpcGitServiceMain(webIpcMain);

function withProjectDir<P extends { dir: string }>(payload: P): P {
	const dir = getCurrentProjectFolder();
	if (!dir) throw new Squawk('no_project_loaded', {});
	return { ...payload, dir };
}

service.registerClone(async (_event, payload: CloneReq) => getBeakHost().git.clone(payload));
service.registerInit(async (_event, payload: InitReq) => getBeakHost().git.init(withProjectDir(payload)));
service.registerStatusMatrix(async (_event, payload: StatusMatrixReq) =>
	getBeakHost().git.statusMatrix(withProjectDir(payload)),
);
service.registerStatus(async (_event, payload: StatusReq) => getBeakHost().git.status(withProjectDir(payload)));
service.registerAdd(async (_event, payload: AddReq) => getBeakHost().git.add(withProjectDir(payload)));
service.registerRemove(async (_event, payload: RemoveReq) => getBeakHost().git.remove(withProjectDir(payload)));
service.registerCommit(async (_event, payload: CommitReq) => getBeakHost().git.commit(withProjectDir(payload)));
service.registerPush(async (_event, payload: PushReq) => getBeakHost().git.push(withProjectDir(payload)));
service.registerPull(async (_event, payload: PullReq) => getBeakHost().git.pull(withProjectDir(payload)));
service.registerFetch(async (_event, payload: FetchReq) => getBeakHost().git.fetch(withProjectDir(payload)));
service.registerCheckout(async (_event, payload: CheckoutReq) => getBeakHost().git.checkout(withProjectDir(payload)));
service.registerBranch(async (_event, payload: BranchReq) => getBeakHost().git.branch(withProjectDir(payload)));
service.registerCurrentBranch(async (_event, payload: CurrentBranchReq) =>
	getBeakHost().git.currentBranch(withProjectDir(payload)),
);
service.registerListBranches(async (_event, payload: ListBranchesReq) =>
	getBeakHost().git.listBranches(withProjectDir(payload)),
);
service.registerLog(async (_event, payload: LogReq) => getBeakHost().git.log(withProjectDir(payload)));
service.registerListRemotes(async (_event, payload: ListRemotesReq) =>
	getBeakHost().git.listRemotes(withProjectDir(payload)),
);
service.registerAddRemote(async (_event, payload: AddRemoteReq) =>
	getBeakHost().git.addRemote(withProjectDir(payload)),
);
service.registerRemoveRemote(async (_event, payload: RemoveRemoteReq) =>
	getBeakHost().git.removeRemote(withProjectDir(payload)),
);
service.registerResolveRef(async (_event, payload: ResolveRefReq) =>
	getBeakHost().git.resolveRef(withProjectDir(payload)),
);
