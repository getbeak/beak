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

import getBeakHost from '../host';
import { webIpcMain } from './ipc';

/**
 * Web-side Git handlers — thin pass-through to `Runtime.git` (BeakGit),
 * which is wired with `isomorphic-git/http/web` plus a default CORS proxy
 * for browser-to-Git-host requests. `dir` is a lightning-fs path
 * (typically `/<project-id>`).
 */
const service = new IpcGitServiceMain(webIpcMain);

service.registerClone(async (_event, payload: CloneReq) => getBeakHost().git.clone(payload));
service.registerInit(async (_event, payload: InitReq) => getBeakHost().git.init(payload));
service.registerStatusMatrix(async (_event, payload: StatusMatrixReq) => getBeakHost().git.statusMatrix(payload));
service.registerStatus(async (_event, payload: StatusReq) => getBeakHost().git.status(payload));
service.registerAdd(async (_event, payload: AddReq) => getBeakHost().git.add(payload));
service.registerRemove(async (_event, payload: RemoveReq) => getBeakHost().git.remove(payload));
service.registerCommit(async (_event, payload: CommitReq) => getBeakHost().git.commit(payload));
service.registerPush(async (_event, payload: PushReq) => getBeakHost().git.push(payload));
service.registerPull(async (_event, payload: PullReq) => getBeakHost().git.pull(payload));
service.registerFetch(async (_event, payload: FetchReq) => getBeakHost().git.fetch(payload));
service.registerCheckout(async (_event, payload: CheckoutReq) => getBeakHost().git.checkout(payload));
service.registerCurrentBranch(async (_event, payload: CurrentBranchReq) => getBeakHost().git.currentBranch(payload));
service.registerListBranches(async (_event, payload: ListBranchesReq) => getBeakHost().git.listBranches(payload));
service.registerLog(async (_event, payload: LogReq) => getBeakHost().git.log(payload));
service.registerListRemotes(async (_event, payload: ListRemotesReq) => getBeakHost().git.listRemotes(payload));
service.registerAddRemote(async (_event, payload: AddRemoteReq) => getBeakHost().git.addRemote(payload));
service.registerRemoveRemote(async (_event, payload: RemoveRemoteReq) => getBeakHost().git.removeRemote(payload));
service.registerResolveRef(async (_event, payload: ResolveRefReq) => getBeakHost().git.resolveRef(payload));
