import type {
	GitCheckoutRequest,
	GitCommitRequest,
	GitCreateBranchRequest,
	GitFetchRequest,
	GitInitRequest,
	GitPullRequest,
	GitPushRequest,
	GitStatusSummary,
} from '@beak/state/git';
import { ipcGitService } from '@beak/ui/lib/ipc';

import { autoStageAll } from './auto-stage';
import { decodeStatusMatrix } from './status-decode';

/**
 * The renderer no longer tracks the project folder — the host pins `dir`
 * to the project root attached to the invoking window before forwarding
 * to isomorphic-git. We still need to satisfy the IPC schema's `min(1)`
 * constraint, so the renderer ships a placeholder.
 */
const dir = '.';

export interface InitResult {
	branch: string | null;
	remotes: Array<{ remote: string; url: string }>;
}

export async function gitInit(req: GitInitRequest): Promise<InitResult> {
	await ipcGitService.init({ dir, defaultBranch: req.defaultBranch ?? 'main' });
	const { branch } = await ipcGitService.currentBranch({ dir });

	let remotes: Array<{ remote: string; url: string }> = [];
	try {
		const result = await ipcGitService.listRemotes({ dir });
		remotes = result.remotes;
	} catch {
		/* no remotes yet — fine */
	}

	return { branch: branch ?? null, remotes };
}

export async function gitFetchStatus(): Promise<GitStatusSummary> {
	const result = await ipcGitService.statusMatrix({ dir });
	return decodeStatusMatrix(result.rows);
}

export interface CommitResult {
	shortOid: string;
}

export async function gitCommit(req: GitCommitRequest): Promise<CommitResult> {
	await autoStageAll(dir);
	const result = await ipcGitService.commit({
		dir,
		message: req.message,
		author: req.author,
		committer: req.committer,
	});
	return { shortOid: result.oid.slice(0, 7) };
}

export interface PushResult {
	ok: boolean;
	error?: string;
}

export async function gitPush(req: GitPushRequest): Promise<PushResult> {
	const result = await ipcGitService.push({
		dir,
		remote: req.remote,
		ref: req.ref,
		force: req.force,
		auth: req.auth,
	});
	return result.ok ? { ok: true } : { ok: false, error: result.error ?? 'Push rejected by remote.' };
}

export async function gitPull(req: GitPullRequest): Promise<void> {
	await ipcGitService.pull({
		dir,
		remote: req.remote,
		ref: req.ref,
		fastForwardOnly: req.fastForwardOnly,
		author: req.author,
		auth: req.auth,
	});
}

export async function gitFetch(req: GitFetchRequest): Promise<void> {
	await ipcGitService.fetch({
		dir,
		remote: req.remote,
		ref: req.ref,
		auth: req.auth,
	});
}

export async function gitCheckout(req: GitCheckoutRequest): Promise<void> {
	await ipcGitService.checkout({
		dir,
		ref: req.ref,
		force: req.force,
	});
}

export async function gitCreateBranch(req: GitCreateBranchRequest): Promise<void> {
	await ipcGitService.branch({
		dir,
		ref: req.ref,
		object: req.object,
	});
}

export async function gitListRemotes(): Promise<Array<{ remote: string; url: string }>> {
	const result = await ipcGitService.listRemotes({ dir });
	return result.remotes;
}
