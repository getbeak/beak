import { z } from 'zod';

import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

/**
 * Git IPC — exposes the host-side `Runtime.git` (isomorphic-git) to the
 * renderer. Both electron and web implement every handler; the differences
 * (native fs vs lightning-fs, native http vs fetch + CORS proxy) are
 * abstracted by the host wiring the right `gitHttp` provider.
 *
 * `dir` is the working-tree path the operation targets. On electron it's an
 * absolute host path; on web it's a lightning-fs path (e.g. `/<project-id>`).
 * The renderer passes whichever it knows about and the host operates on the
 * provided string verbatim — there's no path translation across the IPC.
 *
 * Auth and CORS proxy are accepted per-call so the renderer can prompt the
 * user once per repo rather than persisting credentials on the host.
 * Persistent credential storage is a later concern (keychain on electron,
 * encrypted storage on web).
 */

export const GitMessages = {
	Clone: 'clone',
	Init: 'init',
	Status: 'status',
	StatusMatrix: 'status_matrix',
	Add: 'add',
	Remove: 'remove',
	Commit: 'commit',
	Push: 'push',
	Pull: 'pull',
	Fetch: 'fetch',
	Checkout: 'checkout',
	CurrentBranch: 'current_branch',
	ListBranches: 'list_branches',
	Log: 'log',
	ListRemotes: 'list_remotes',
	AddRemote: 'add_remote',
	RemoveRemote: 'remove_remote',
	ResolveRef: 'resolve_ref',
} as const;

const authSchema = z
	.object({
		username: z.string().optional(),
		password: z.string().optional(),
	})
	.optional();

const authorSchema = z.object({
	name: z.string().min(1),
	email: z.string().min(1),
});

export interface GitAuth {
	username?: string;
	password?: string;
}

export interface GitAuthor {
	name: string;
	email: string;
}

export interface CloneReq {
	url: string;
	dir: string;
	ref?: string;
	singleBranch?: boolean;
	depth?: number;
	corsProxy?: string;
	auth?: GitAuth;
}

const cloneSchema = z.object({
	url: z.string().min(1),
	dir: z.string().min(1),
	ref: z.string().optional(),
	singleBranch: z.boolean().optional(),
	depth: z.number().int().positive().optional(),
	corsProxy: z.string().optional(),
	auth: authSchema,
});

export interface CloneRes {
	dir: string;
	ref: string;
}

export interface InitReq {
	dir: string;
	defaultBranch?: string;
}

const initSchema = z.object({
	dir: z.string().min(1),
	defaultBranch: z.string().optional(),
});

export type StatusMatrixRow = [filepath: string, head: 0 | 1, workdir: 0 | 1 | 2, stage: 0 | 1 | 2 | 3];

export interface StatusMatrixReq {
	dir: string;
	filepaths?: string[];
}

const statusMatrixSchema = z.object({
	dir: z.string().min(1),
	filepaths: z.array(z.string()).optional(),
});

export interface StatusMatrixRes {
	rows: StatusMatrixRow[];
}

export interface StatusReq {
	dir: string;
	filepath: string;
}

const statusSchema = z.object({
	dir: z.string().min(1),
	filepath: z.string().min(1),
});

export interface StatusRes {
	/**
	 * One of isomorphic-git's status strings:
	 *   'ignored', 'unmodified', '*modified', '*deleted', '*added',
	 *   'absent', 'modified', 'deleted', 'added', '*unmodified',
	 *   '*absent', '*undeleted', '*undeletemodified'
	 */
	status: string;
}

export interface AddReq {
	dir: string;
	filepath: string | string[];
}

const addSchema = z.object({
	dir: z.string().min(1),
	filepath: z.union([z.string(), z.array(z.string())]),
});

export interface RemoveReq {
	dir: string;
	filepath: string;
}

const removeSchema = z.object({
	dir: z.string().min(1),
	filepath: z.string().min(1),
});

export interface CommitReq {
	dir: string;
	message: string;
	author: GitAuthor;
	committer?: GitAuthor;
	parent?: string[];
}

const commitSchema = z.object({
	dir: z.string().min(1),
	message: z.string().min(1),
	author: authorSchema,
	committer: authorSchema.optional(),
	parent: z.array(z.string()).optional(),
});

export interface CommitRes {
	oid: string;
}

export interface PushReq {
	dir: string;
	remote?: string;
	ref?: string;
	remoteRef?: string;
	force?: boolean;
	corsProxy?: string;
	auth?: GitAuth;
}

const pushSchema = z.object({
	dir: z.string().min(1),
	remote: z.string().optional(),
	ref: z.string().optional(),
	remoteRef: z.string().optional(),
	force: z.boolean().optional(),
	corsProxy: z.string().optional(),
	auth: authSchema,
});

export interface PushRes {
	ok: boolean;
	error?: string;
}

export interface PullReq {
	dir: string;
	remote?: string;
	ref?: string;
	singleBranch?: boolean;
	fastForwardOnly?: boolean;
	author: GitAuthor;
	corsProxy?: string;
	auth?: GitAuth;
}

const pullSchema = z.object({
	dir: z.string().min(1),
	remote: z.string().optional(),
	ref: z.string().optional(),
	singleBranch: z.boolean().optional(),
	fastForwardOnly: z.boolean().optional(),
	author: authorSchema,
	corsProxy: z.string().optional(),
	auth: authSchema,
});

export interface FetchReq {
	dir: string;
	remote?: string;
	ref?: string;
	depth?: number;
	corsProxy?: string;
	auth?: GitAuth;
}

const fetchSchema = z.object({
	dir: z.string().min(1),
	remote: z.string().optional(),
	ref: z.string().optional(),
	depth: z.number().int().positive().optional(),
	corsProxy: z.string().optional(),
	auth: authSchema,
});

export interface CheckoutReq {
	dir: string;
	ref: string;
	filepaths?: string[];
	force?: boolean;
}

const checkoutSchema = z.object({
	dir: z.string().min(1),
	ref: z.string().min(1),
	filepaths: z.array(z.string()).optional(),
	force: z.boolean().optional(),
});

export interface CurrentBranchReq {
	dir: string;
	fullName?: boolean;
}

const currentBranchSchema = z.object({
	dir: z.string().min(1),
	fullName: z.boolean().optional(),
});

export interface CurrentBranchRes {
	branch: string | null;
}

export interface ListBranchesReq {
	dir: string;
	remote?: string;
}

const listBranchesSchema = z.object({
	dir: z.string().min(1),
	remote: z.string().optional(),
});

export interface ListBranchesRes {
	branches: string[];
}

export interface LogReq {
	dir: string;
	depth?: number;
	ref?: string;
}

const logSchema = z.object({
	dir: z.string().min(1),
	depth: z.number().int().positive().optional(),
	ref: z.string().optional(),
});

export interface LogEntry {
	oid: string;
	message: string;
	author: { name: string; email: string; timestamp: number };
	committer: { name: string; email: string; timestamp: number };
	parent: string[];
}

export interface LogRes {
	entries: LogEntry[];
}

export interface ListRemotesReq {
	dir: string;
}

const listRemotesSchema = z.object({
	dir: z.string().min(1),
});

export interface ListRemotesRes {
	remotes: Array<{ remote: string; url: string }>;
}

export interface AddRemoteReq {
	dir: string;
	remote: string;
	url: string;
	force?: boolean;
}

const addRemoteSchema = z.object({
	dir: z.string().min(1),
	remote: z.string().min(1),
	url: z.string().min(1),
	force: z.boolean().optional(),
});

export interface RemoveRemoteReq {
	dir: string;
	remote: string;
}

const removeRemoteSchema = z.object({
	dir: z.string().min(1),
	remote: z.string().min(1),
});

export interface ResolveRefReq {
	dir: string;
	ref: string;
}

const resolveRefSchema = z.object({
	dir: z.string().min(1),
	ref: z.string().min(1),
});

export interface ResolveRefRes {
	oid: string | null;
}

export class IpcGitServiceRenderer extends IpcServiceRenderer<'git'> {
	constructor(ipc: PartialIpcRenderer) {
		super('git', ipc);
	}

	async clone(payload: CloneReq) {
		return this.invoke<CloneRes>(GitMessages.Clone, payload);
	}

	async init(payload: InitReq) {
		return this.invoke<void>(GitMessages.Init, payload);
	}

	async statusMatrix(payload: StatusMatrixReq) {
		return this.invoke<StatusMatrixRes>(GitMessages.StatusMatrix, payload);
	}

	async status(payload: StatusReq) {
		return this.invoke<StatusRes>(GitMessages.Status, payload);
	}

	async add(payload: AddReq) {
		return this.invoke<void>(GitMessages.Add, payload);
	}

	async remove(payload: RemoveReq) {
		return this.invoke<void>(GitMessages.Remove, payload);
	}

	async commit(payload: CommitReq) {
		return this.invoke<CommitRes>(GitMessages.Commit, payload);
	}

	async push(payload: PushReq) {
		return this.invoke<PushRes>(GitMessages.Push, payload);
	}

	async pull(payload: PullReq) {
		return this.invoke<void>(GitMessages.Pull, payload);
	}

	async fetch(payload: FetchReq) {
		return this.invoke<void>(GitMessages.Fetch, payload);
	}

	async checkout(payload: CheckoutReq) {
		return this.invoke<void>(GitMessages.Checkout, payload);
	}

	async currentBranch(payload: CurrentBranchReq) {
		return this.invoke<CurrentBranchRes>(GitMessages.CurrentBranch, payload);
	}

	async listBranches(payload: ListBranchesReq) {
		return this.invoke<ListBranchesRes>(GitMessages.ListBranches, payload);
	}

	async log(payload: LogReq) {
		return this.invoke<LogRes>(GitMessages.Log, payload);
	}

	async listRemotes(payload: ListRemotesReq) {
		return this.invoke<ListRemotesRes>(GitMessages.ListRemotes, payload);
	}

	async addRemote(payload: AddRemoteReq) {
		return this.invoke<void>(GitMessages.AddRemote, payload);
	}

	async removeRemote(payload: RemoveRemoteReq) {
		return this.invoke<void>(GitMessages.RemoveRemote, payload);
	}

	async resolveRef(payload: ResolveRefReq) {
		return this.invoke<ResolveRefRes>(GitMessages.ResolveRef, payload);
	}
}

export class IpcGitServiceMain extends IpcServiceMain<'git'> {
	constructor(ipc: PartialIpcMain) {
		super('git', ipc);
	}

	registerClone(fn: IpcListener<CloneReq>) {
		this.registerRequestHandler(GitMessages.Clone, fn, cloneSchema as never);
	}

	registerInit(fn: IpcListener<InitReq>) {
		this.registerRequestHandler(GitMessages.Init, fn, initSchema as never);
	}

	registerStatusMatrix(fn: IpcListener<StatusMatrixReq>) {
		this.registerRequestHandler(GitMessages.StatusMatrix, fn, statusMatrixSchema as never);
	}

	registerStatus(fn: IpcListener<StatusReq>) {
		this.registerRequestHandler(GitMessages.Status, fn, statusSchema as never);
	}

	registerAdd(fn: IpcListener<AddReq>) {
		this.registerRequestHandler(GitMessages.Add, fn, addSchema as never);
	}

	registerRemove(fn: IpcListener<RemoveReq>) {
		this.registerRequestHandler(GitMessages.Remove, fn, removeSchema as never);
	}

	registerCommit(fn: IpcListener<CommitReq>) {
		this.registerRequestHandler(GitMessages.Commit, fn, commitSchema as never);
	}

	registerPush(fn: IpcListener<PushReq>) {
		this.registerRequestHandler(GitMessages.Push, fn, pushSchema as never);
	}

	registerPull(fn: IpcListener<PullReq>) {
		this.registerRequestHandler(GitMessages.Pull, fn, pullSchema as never);
	}

	registerFetch(fn: IpcListener<FetchReq>) {
		this.registerRequestHandler(GitMessages.Fetch, fn, fetchSchema as never);
	}

	registerCheckout(fn: IpcListener<CheckoutReq>) {
		this.registerRequestHandler(GitMessages.Checkout, fn, checkoutSchema as never);
	}

	registerCurrentBranch(fn: IpcListener<CurrentBranchReq>) {
		this.registerRequestHandler(GitMessages.CurrentBranch, fn, currentBranchSchema as never);
	}

	registerListBranches(fn: IpcListener<ListBranchesReq>) {
		this.registerRequestHandler(GitMessages.ListBranches, fn, listBranchesSchema as never);
	}

	registerLog(fn: IpcListener<LogReq>) {
		this.registerRequestHandler(GitMessages.Log, fn, logSchema as never);
	}

	registerListRemotes(fn: IpcListener<ListRemotesReq>) {
		this.registerRequestHandler(GitMessages.ListRemotes, fn, listRemotesSchema as never);
	}

	registerAddRemote(fn: IpcListener<AddRemoteReq>) {
		this.registerRequestHandler(GitMessages.AddRemote, fn, addRemoteSchema as never);
	}

	registerRemoveRemote(fn: IpcListener<RemoveRemoteReq>) {
		this.registerRequestHandler(GitMessages.RemoveRemote, fn, removeRemoteSchema as never);
	}

	registerResolveRef(fn: IpcListener<ResolveRefReq>) {
		this.registerRequestHandler(GitMessages.ResolveRef, fn, resolveRefSchema as never);
	}
}
