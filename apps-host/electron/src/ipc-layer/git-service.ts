import getRuntime from '@beak/apps-host-electron/host';
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
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

import { getProjectFolder } from './utils';

/**
 * Electron-side bindings for the Git IPC channel — thin pass-through to
 * `Runtime.git` (BeakGit), which is wired with `isomorphic-git/http/node`.
 *
 * Every window-bound op pins `dir` to the project root the window is
 * attached to. The renderer's `dir` field is ignored for those ops — the
 * payload just needs to satisfy the schema. `clone` is the one exception:
 * it legitimately writes to an arbitrary new path supplied by the caller.
 */
const service = new IpcGitServiceMain(ipcMain);

function withProjectDir<P extends { dir: string }>(event: IpcMainInvokeEvent, payload: P): P {
	return { ...payload, dir: getProjectFolder(event) };
}

service.registerClone(async (_event, payload: CloneReq) => getRuntime().git.clone(payload));
service.registerInit(async (event, payload: InitReq) => getRuntime().git.init(withProjectDir(event, payload)));
service.registerStatusMatrix(async (event, payload: StatusMatrixReq) =>
	getRuntime().git.statusMatrix(withProjectDir(event, payload)),
);
service.registerStatus(async (event, payload: StatusReq) => getRuntime().git.status(withProjectDir(event, payload)));
service.registerAdd(async (event, payload: AddReq) => getRuntime().git.add(withProjectDir(event, payload)));
service.registerRemove(async (event, payload: RemoveReq) => getRuntime().git.remove(withProjectDir(event, payload)));
service.registerCommit(async (event, payload: CommitReq) => getRuntime().git.commit(withProjectDir(event, payload)));
service.registerPush(async (event, payload: PushReq) => getRuntime().git.push(withProjectDir(event, payload)));
service.registerPull(async (event, payload: PullReq) => getRuntime().git.pull(withProjectDir(event, payload)));
service.registerFetch(async (event, payload: FetchReq) => getRuntime().git.fetch(withProjectDir(event, payload)));
service.registerCheckout(async (event, payload: CheckoutReq) =>
	getRuntime().git.checkout(withProjectDir(event, payload)),
);
service.registerBranch(async (event, payload: BranchReq) => getRuntime().git.branch(withProjectDir(event, payload)));
service.registerCurrentBranch(async (event, payload: CurrentBranchReq) =>
	getRuntime().git.currentBranch(withProjectDir(event, payload)),
);
service.registerListBranches(async (event, payload: ListBranchesReq) =>
	getRuntime().git.listBranches(withProjectDir(event, payload)),
);
service.registerLog(async (event, payload: LogReq) => getRuntime().git.log(withProjectDir(event, payload)));
service.registerListRemotes(async (event, payload: ListRemotesReq) =>
	getRuntime().git.listRemotes(withProjectDir(event, payload)),
);
service.registerAddRemote(async (event, payload: AddRemoteReq) =>
	getRuntime().git.addRemote(withProjectDir(event, payload)),
);
service.registerRemoveRemote(async (event, payload: RemoveRemoteReq) =>
	getRuntime().git.removeRemote(withProjectDir(event, payload)),
);
service.registerResolveRef(async (event, payload: ResolveRefReq) =>
	getRuntime().git.resolveRef(withProjectDir(event, payload)),
);
