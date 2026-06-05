import type { IpcGitServiceMain } from '@beak/common/ipc/git';

import type BeakGit from '.';

/**
 * Register every Git IPC handler against a shared `BeakGit`. The 17
 * project-bound operations all share the same shape — overwrite the
 * renderer-supplied `dir` with the open project's folder, delegate to
 * the runtime, return the result — so each was 1–2 lines of identical
 * boilerplate in both hosts. Consolidated here so both hosts call this
 * once with their event → folder resolver.
 *
 * `clone` is the one exception. It writes to an arbitrary new path
 * supplied by the caller (the workflow that runs is "clone this URL to
 * THIS folder"), so it doesn't get the `withProjectDir` rewrite.
 */
export interface GitBindingsOptions<TEvent> {
	/** Resolve the open project's folder for the given IPC event. */
	resolveProjectDir: (event: TEvent) => string;
}

export function registerGitBindings<TEvent>(
	service: IpcGitServiceMain,
	git: BeakGit,
	options: GitBindingsOptions<TEvent>,
): void {
	const withProjectDir = <P extends { dir: string }>(event: unknown, payload: P): P => ({
		...payload,
		dir: options.resolveProjectDir(event as TEvent),
	});

	service.registerClone(async (_event, payload) => git.clone(payload));

	service.registerInit(async (event, payload) => git.init(withProjectDir(event, payload)));
	service.registerStatusMatrix(async (event, payload) => git.statusMatrix(withProjectDir(event, payload)));
	service.registerStatus(async (event, payload) => git.status(withProjectDir(event, payload)));
	service.registerAdd(async (event, payload) => git.add(withProjectDir(event, payload)));
	service.registerRemove(async (event, payload) => git.remove(withProjectDir(event, payload)));
	service.registerCommit(async (event, payload) => git.commit(withProjectDir(event, payload)));
	service.registerPush(async (event, payload) => git.push(withProjectDir(event, payload)));
	service.registerPull(async (event, payload) => git.pull(withProjectDir(event, payload)));
	service.registerFetch(async (event, payload) => git.fetch(withProjectDir(event, payload)));
	service.registerCheckout(async (event, payload) => git.checkout(withProjectDir(event, payload)));
	service.registerBranch(async (event, payload) => git.branch(withProjectDir(event, payload)));
	service.registerCurrentBranch(async (event, payload) => git.currentBranch(withProjectDir(event, payload)));
	service.registerListBranches(async (event, payload) => git.listBranches(withProjectDir(event, payload)));
	service.registerLog(async (event, payload) => git.log(withProjectDir(event, payload)));
	service.registerListRemotes(async (event, payload) => git.listRemotes(withProjectDir(event, payload)));
	service.registerAddRemote(async (event, payload) => git.addRemote(withProjectDir(event, payload)));
	service.registerRemoveRemote(async (event, payload) => git.removeRemote(withProjectDir(event, payload)));
	service.registerResolveRef(async (event, payload) => git.resolveRef(withProjectDir(event, payload)));
}
