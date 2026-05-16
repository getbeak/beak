import getRuntime from '@beak/apps-host-electron/host';
import {
	type AddReq,
	type AddRemoteReq,
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
import { ipcMain } from 'electron';

/**
 * Electron-side bindings for the Git IPC channel — thin pass-through to
 * `Runtime.git` (BeakGit), which is wired with `isomorphic-git/http/node`.
 *
 * Sandboxing TODO: every op accepts `dir` from the renderer verbatim. For
 * window-bound operations (commit / push / pull / status / …) we should
 * pin `dir` to the project root attached to the invoking window. Clone
 * is the only operation that legitimately wants an arbitrary new path,
 * and Phase 5 will route it through a host-driven folder picker so the
 * renderer doesn't synthesize the destination either.
 */
const service = new IpcGitServiceMain(ipcMain);

service.registerClone(async (_event, payload: CloneReq) => getRuntime().git.clone(payload));
service.registerInit(async (_event, payload: InitReq) => getRuntime().git.init(payload));
service.registerStatusMatrix(async (_event, payload: StatusMatrixReq) => getRuntime().git.statusMatrix(payload));
service.registerStatus(async (_event, payload: StatusReq) => getRuntime().git.status(payload));
service.registerAdd(async (_event, payload: AddReq) => getRuntime().git.add(payload));
service.registerRemove(async (_event, payload: RemoveReq) => getRuntime().git.remove(payload));
service.registerCommit(async (_event, payload: CommitReq) => getRuntime().git.commit(payload));
service.registerPush(async (_event, payload: PushReq) => getRuntime().git.push(payload));
service.registerPull(async (_event, payload: PullReq) => getRuntime().git.pull(payload));
service.registerFetch(async (_event, payload: FetchReq) => getRuntime().git.fetch(payload));
service.registerCheckout(async (_event, payload: CheckoutReq) => getRuntime().git.checkout(payload));
service.registerCurrentBranch(async (_event, payload: CurrentBranchReq) => getRuntime().git.currentBranch(payload));
service.registerListBranches(async (_event, payload: ListBranchesReq) => getRuntime().git.listBranches(payload));
service.registerLog(async (_event, payload: LogReq) => getRuntime().git.log(payload));
service.registerListRemotes(async (_event, payload: ListRemotesReq) => getRuntime().git.listRemotes(payload));
service.registerAddRemote(async (_event, payload: AddRemoteReq) => getRuntime().git.addRemote(payload));
service.registerRemoveRemote(async (_event, payload: RemoveRemoteReq) => getRuntime().git.removeRemote(payload));
service.registerResolveRef(async (_event, payload: ResolveRefReq) => getRuntime().git.resolveRef(payload));
