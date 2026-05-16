import type {
	AddReq,
	AddRemoteReq,
	CheckoutReq,
	CloneReq,
	CloneRes,
	CommitReq,
	CommitRes,
	CurrentBranchReq,
	CurrentBranchRes,
	FetchReq,
	GitAuth,
	InitReq,
	ListBranchesReq,
	ListBranchesRes,
	ListRemotesReq,
	ListRemotesRes,
	LogReq,
	LogRes,
	PullReq,
	PushReq,
	PushRes,
	RemoveRemoteReq,
	RemoveReq,
	ResolveRefReq,
	ResolveRefRes,
	StatusMatrixReq,
	StatusMatrixRes,
	StatusReq,
	StatusRes,
} from '@beak/common/ipc/git';
import git, { type HttpClient } from 'isomorphic-git';

import { BeakBase, type Providers } from '../base';

/**
 * Optional Git provider on the runtime's providers map. Hosts wire it with
 * the appropriate transport (`isomorphic-git/http/node` on electron,
 * `isomorphic-git/http/web` on web) and an optional default CORS proxy.
 *
 * Local-only operations (status, add, commit, log, branch list) work even
 * if the provider isn't wired, since they don't touch the network — but the
 * BeakGit instance still needs the providers object to access `node.fs`.
 *
 * Network ops (clone, push, pull, fetch) throw if `http` is missing.
 */
export interface GitProvider {
	http: HttpClient;
	corsProxy?: string;
}

export interface BeakGitProviders extends Providers {
	git?: GitProvider;
}

/**
 * Host-side git operations, backed by isomorphic-git. Used by the IPC
 * git-service handlers and (potentially) by other host code that needs to
 * inspect a repo (e.g. the migration runner before promoting a project).
 *
 * Method names mirror the IPC payload types one-for-one so the
 * git-service handler stays a thin pass-through.
 */
export default class BeakGit extends BeakBase {
	readonly providers: BeakGitProviders;

	constructor(providers: BeakGitProviders) {
		super(providers);
		this.providers = providers;
	}

	private get fs() {
		return this.providers.node.fs;
	}

	private requireHttp(): HttpClient {
		const provider = this.providers.git;
		if (!provider?.http) {
			throw new Error('Git: no HTTP transport is wired on this host. Cannot perform network operations.');
		}
		return provider.http;
	}

	private resolveCorsProxy(perCallProxy: string | undefined): string | undefined {
		if (perCallProxy !== undefined) return perCallProxy;
		return this.providers.git?.corsProxy;
	}

	private onAuthFromCreds(auth: GitAuth | undefined) {
		if (!auth) return undefined;
		return () => ({ username: auth.username, password: auth.password });
	}

	async clone(payload: CloneReq): Promise<CloneRes> {
		await git.clone({
			fs: this.fs,
			http: this.requireHttp(),
			dir: payload.dir,
			url: payload.url,
			ref: payload.ref,
			singleBranch: payload.singleBranch,
			depth: payload.depth,
			corsProxy: this.resolveCorsProxy(payload.corsProxy),
			onAuth: this.onAuthFromCreds(payload.auth),
		});
		const branch = await git.currentBranch({ fs: this.fs, dir: payload.dir });
		return { dir: payload.dir, ref: branch ?? payload.ref ?? 'HEAD' };
	}

	async init(payload: InitReq): Promise<void> {
		await git.init({
			fs: this.fs,
			dir: payload.dir,
			defaultBranch: payload.defaultBranch,
		});
	}

	async statusMatrix(payload: StatusMatrixReq): Promise<StatusMatrixRes> {
		const rows = await git.statusMatrix({
			fs: this.fs,
			dir: payload.dir,
			filepaths: payload.filepaths,
		});
		return { rows: rows as StatusMatrixRes['rows'] };
	}

	async status(payload: StatusReq): Promise<StatusRes> {
		const status = await git.status({
			fs: this.fs,
			dir: payload.dir,
			filepath: payload.filepath,
		});
		return { status };
	}

	async add(payload: AddReq): Promise<void> {
		await git.add({ fs: this.fs, dir: payload.dir, filepath: payload.filepath });
	}

	async remove(payload: RemoveReq): Promise<void> {
		await git.remove({ fs: this.fs, dir: payload.dir, filepath: payload.filepath });
	}

	async commit(payload: CommitReq): Promise<CommitRes> {
		const oid = await git.commit({
			fs: this.fs,
			dir: payload.dir,
			message: payload.message,
			author: payload.author,
			committer: payload.committer,
			parent: payload.parent,
		});
		return { oid };
	}

	async push(payload: PushReq): Promise<PushRes> {
		const result = await git.push({
			fs: this.fs,
			http: this.requireHttp(),
			dir: payload.dir,
			remote: payload.remote,
			ref: payload.ref,
			remoteRef: payload.remoteRef,
			force: payload.force,
			corsProxy: this.resolveCorsProxy(payload.corsProxy),
			onAuth: this.onAuthFromCreds(payload.auth),
		});
		return { ok: result.ok, error: result.error ?? undefined };
	}

	async pull(payload: PullReq): Promise<void> {
		await git.pull({
			fs: this.fs,
			http: this.requireHttp(),
			dir: payload.dir,
			remote: payload.remote,
			ref: payload.ref,
			singleBranch: payload.singleBranch,
			fastForward: payload.fastForwardOnly,
			author: payload.author,
			corsProxy: this.resolveCorsProxy(payload.corsProxy),
			onAuth: this.onAuthFromCreds(payload.auth),
		});
	}

	async fetch(payload: FetchReq): Promise<void> {
		await git.fetch({
			fs: this.fs,
			http: this.requireHttp(),
			dir: payload.dir,
			remote: payload.remote,
			ref: payload.ref,
			depth: payload.depth,
			corsProxy: this.resolveCorsProxy(payload.corsProxy),
			onAuth: this.onAuthFromCreds(payload.auth),
		});
	}

	async checkout(payload: CheckoutReq): Promise<void> {
		await git.checkout({
			fs: this.fs,
			dir: payload.dir,
			ref: payload.ref,
			filepaths: payload.filepaths,
			force: payload.force,
		});
	}

	async currentBranch(payload: CurrentBranchReq): Promise<CurrentBranchRes> {
		const branch = await git.currentBranch({
			fs: this.fs,
			dir: payload.dir,
			fullname: payload.fullName,
		});
		return { branch: branch ?? null };
	}

	async listBranches(payload: ListBranchesReq): Promise<ListBranchesRes> {
		const branches = await git.listBranches({
			fs: this.fs,
			dir: payload.dir,
			remote: payload.remote,
		});
		return { branches };
	}

	async log(payload: LogReq): Promise<LogRes> {
		const log = await git.log({
			fs: this.fs,
			dir: payload.dir,
			depth: payload.depth,
			ref: payload.ref,
		});
		return {
			entries: log.map(commit => ({
				oid: commit.oid,
				message: commit.commit.message,
				author: {
					name: commit.commit.author.name,
					email: commit.commit.author.email,
					timestamp: commit.commit.author.timestamp,
				},
				committer: {
					name: commit.commit.committer.name,
					email: commit.commit.committer.email,
					timestamp: commit.commit.committer.timestamp,
				},
				parent: commit.commit.parent ?? [],
			})),
		};
	}

	async listRemotes(payload: ListRemotesReq): Promise<ListRemotesRes> {
		const remotes = await git.listRemotes({ fs: this.fs, dir: payload.dir });
		return { remotes };
	}

	async addRemote(payload: AddRemoteReq): Promise<void> {
		await git.addRemote({
			fs: this.fs,
			dir: payload.dir,
			remote: payload.remote,
			url: payload.url,
			force: payload.force,
		});
	}

	async removeRemote(payload: RemoveRemoteReq): Promise<void> {
		await git.deleteRemote({ fs: this.fs, dir: payload.dir, remote: payload.remote });
	}

	async resolveRef(payload: ResolveRefReq): Promise<ResolveRefRes> {
		try {
			const oid = await git.resolveRef({ fs: this.fs, dir: payload.dir, ref: payload.ref });
			return { oid };
		} catch {
			return { oid: null };
		}
	}
}
