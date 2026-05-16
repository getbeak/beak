import {
	type GitFileStatus,
	type GitOperation,
	addBranch,
	changeSelectedBranch,
	gitOpened,
	operationFailed,
	operationStarted,
	operationSucceeded,
	remotesUpdated,
	removeBranch,
	requestCheckout,
	requestCommit,
	requestFetch,
	requestPull,
	requestPush,
	requestStatus,
	startGit,
	statusFailed,
	statusFetched,
} from '@beak/state/git';
import createFsEmitter, { type FsSubscription, scanDirectoryRecursively } from '@beak/ui/lib/fs-emitter';
import { ipcFsService, ipcGitService } from '@beak/ui/lib/ipc';
import path from 'path-browserify';

import type { ApplicationState } from '..';
import type { AppStartListening } from '../listener';

const headPrefix = path.join('refs', 'heads');
const headPrefixFs = path.join('.git', headPrefix);
const headFilePathFs = path.join('.git', 'HEAD');

function resolveDir(state: ApplicationState): string {
	return state.global.project.folderPath ?? '';
}

export function registerGitEffects(start: AppStartListening) {
	start({
		actionCreator: startGit,
		effect: async (_action, api) => {
			await initialImport(api);

			const subscription: FsSubscription = createFsEmitter(
				'.git',
				async event => {
					if (!['add', 'change', 'unlink'].includes(event.type)) return;

					if (event.type === 'add' || event.type === 'change') {
						const isHeadFile = event.path === headFilePathFs;
						const isHeadRef = event.path.startsWith(headPrefixFs);

						if (isHeadRef) {
							const branch = event.path.slice(headPrefixFs.length + 1);
							api.dispatch(addBranch(branch));
						} else if (isHeadFile) {
							const branch = await parsePointerFile(event.path);
							api.dispatch(changeSelectedBranch(branch));
						}
					} else if (event.type === 'unlink') {
						if (!event.path.startsWith(headPrefixFs)) return;
						const branch = event.path.slice(headPrefixFs.length + 1);
						api.dispatch(removeBranch(branch));
					}
				},
				{ depth: 5, followSymlinks: false },
			);

			void subscription;

			// Surface remotes once on open so the source-control panel can render
			// them immediately.
			try {
				const dir = resolveDir(api.getState() as ApplicationState);
				if (dir) {
					const remotes = await ipcGitService.listRemotes({ dir });
					api.dispatch(remotesUpdated(remotes.remotes));
				}
			} catch {
				/* not a git repo or read failed — silently skip */
			}
		},
	});

	start({
		actionCreator: requestStatus,
		effect: async (_action, api) => {
			const dir = resolveDir(api.getState() as ApplicationState);
			if (!dir) {
				api.dispatch(statusFailed('No project folder bound to this window.'));
				return;
			}
			try {
				const result = await ipcGitService.statusMatrix({ dir });
				api.dispatch(statusFetched(summariseStatus(result.rows)));
			} catch (err) {
				api.dispatch(statusFailed(err instanceof Error ? err.message : String(err)));
			}
		},
	});

	start({
		actionCreator: requestCommit,
		effect: async (action, api) => {
			const op: GitOperation = 'commit';
			const dir = resolveDir(api.getState() as ApplicationState);
			if (!dir) {
				api.dispatch(operationFailed({ op, error: 'No project folder bound to this window.' }));
				return;
			}
			api.dispatch(operationStarted({ op }));
			try {
				const result = await ipcGitService.commit({
					dir,
					message: action.payload.message,
					author: action.payload.author,
					committer: action.payload.committer,
				});
				api.dispatch(operationSucceeded({ op, notice: result.oid.slice(0, 7) }));
				api.dispatch(requestStatus());
			} catch (err) {
				api.dispatch(operationFailed({ op, error: err instanceof Error ? err.message : String(err) }));
			}
		},
	});

	start({
		actionCreator: requestPush,
		effect: async (action, api) => {
			const op: GitOperation = 'push';
			const dir = resolveDir(api.getState() as ApplicationState);
			if (!dir) {
				api.dispatch(operationFailed({ op, error: 'No project folder bound to this window.' }));
				return;
			}
			api.dispatch(operationStarted({ op }));
			try {
				const result = await ipcGitService.push({
					dir,
					remote: action.payload.remote,
					ref: action.payload.ref,
					force: action.payload.force,
					auth: action.payload.auth,
				});
				if (result.ok) {
					api.dispatch(operationSucceeded({ op }));
				} else {
					api.dispatch(operationFailed({ op, error: result.error ?? 'Push rejected by remote.' }));
				}
			} catch (err) {
				api.dispatch(operationFailed({ op, error: err instanceof Error ? err.message : String(err) }));
			}
		},
	});

	start({
		actionCreator: requestPull,
		effect: async (action, api) => {
			const op: GitOperation = 'pull';
			const dir = resolveDir(api.getState() as ApplicationState);
			if (!dir) {
				api.dispatch(operationFailed({ op, error: 'No project folder bound to this window.' }));
				return;
			}
			api.dispatch(operationStarted({ op }));
			try {
				await ipcGitService.pull({
					dir,
					remote: action.payload.remote,
					ref: action.payload.ref,
					fastForwardOnly: action.payload.fastForwardOnly,
					author: action.payload.author,
					auth: action.payload.auth,
				});
				api.dispatch(operationSucceeded({ op }));
				api.dispatch(requestStatus());
			} catch (err) {
				api.dispatch(operationFailed({ op, error: err instanceof Error ? err.message : String(err) }));
			}
		},
	});

	start({
		actionCreator: requestFetch,
		effect: async (action, api) => {
			const op: GitOperation = 'fetch';
			const dir = resolveDir(api.getState() as ApplicationState);
			if (!dir) {
				api.dispatch(operationFailed({ op, error: 'No project folder bound to this window.' }));
				return;
			}
			api.dispatch(operationStarted({ op }));
			try {
				await ipcGitService.fetch({
					dir,
					remote: action.payload.remote,
					ref: action.payload.ref,
					auth: action.payload.auth,
				});
				api.dispatch(operationSucceeded({ op }));
			} catch (err) {
				api.dispatch(operationFailed({ op, error: err instanceof Error ? err.message : String(err) }));
			}
		},
	});

	start({
		actionCreator: requestCheckout,
		effect: async (action, api) => {
			const op: GitOperation = 'checkout';
			const dir = resolveDir(api.getState() as ApplicationState);
			if (!dir) {
				api.dispatch(operationFailed({ op, error: 'No project folder bound to this window.' }));
				return;
			}
			api.dispatch(operationStarted({ op }));
			try {
				await ipcGitService.checkout({
					dir,
					ref: action.payload.ref,
					force: action.payload.force,
				});
				api.dispatch(operationSucceeded({ op }));
				api.dispatch(requestStatus());
			} catch (err) {
				api.dispatch(operationFailed({ op, error: err instanceof Error ? err.message : String(err) }));
			}
		},
	});
}

async function initialImport(api: { dispatch: (a: { type: string; [k: string]: unknown }) => unknown }) {
	const hasGit = await ipcFsService.pathExists('.git');
	if (!hasGit) return;

	const items = await scanDirectoryRecursively('.git', true);
	const files = items.filter(i => !i.isDirectory).map(i => i.path);
	const heads = files.filter(f => f.startsWith(headPrefixFs)).map(f => f.slice(headPrefixFs.length + 1));
	const headFilePath = files.find(f => f === path.join('.git', 'HEAD'));

	if (!headFilePath) return;

	api.dispatch(
		gitOpened({
			branches: heads.map(h => ({ name: h })),
			selectedBranch: await parsePointerFile(headFilePath),
		}),
	);
}

async function parsePointerFile(p: string) {
	const file = await ipcFsService.readText(p);
	const parts = file.trim().match(/^ref:\s*refs\/heads\/(.+)$/);

	if (!parts) return void 0;

	return parts[1];
}

/**
 * Roll up isomorphic-git's status matrix into the slice-friendly summary.
 *
 * Matrix codes are `[filepath, HEAD, WORKDIR, STAGE]` where:
 *   HEAD:    0 = absent, 1 = present
 *   WORKDIR: 0 = absent, 1 = identical to HEAD, 2 = different
 *   STAGE:   0 = absent, 1 = identical to HEAD, 2 = identical to WORKDIR, 3 = different
 *
 * From there:
 *   staged    = stage !== head (something is queued for the next commit)
 *   unstaged  = workdir > 0 && workdir !== stage (working tree drifts from index)
 *   untracked = head === 0 && workdir > 0 (file is new — never seen by git)
 *   deleted   = head !== 0 && workdir === 0 (gone from disk; staging may differ)
 */
function summariseStatus(rows: Array<[string, 0 | 1, 0 | 1 | 2, 0 | 1 | 2 | 3]>): {
	staged: number;
	unstaged: number;
	untracked: number;
	files: GitFileStatus[];
	updatedAt: string;
} {
	const files: GitFileStatus[] = [];
	let staged = 0;
	let unstaged = 0;
	let untracked = 0;

	for (const [filepath, head, workdir, stage] of rows) {
		const isStaged = stage !== head;
		const isUnstaged = workdir > 0 && workdir !== stage;
		const isUntracked = head === 0 && workdir > 0;
		const isDeleted = head !== 0 && workdir === 0;
		if (!isStaged && !isUnstaged && !isUntracked && !isDeleted) continue;
		files.push({ filepath, staged: isStaged, unstaged: isUnstaged, untracked: isUntracked, deleted: isDeleted });
		if (isStaged) staged++;
		if (isUnstaged) unstaged++;
		if (isUntracked) untracked++;
	}

	return { staged, unstaged, untracked, files, updatedAt: new Date().toISOString() };
}
