import {
	addBranch,
	changeSelectedBranch,
	type GitOperation,
	gitOpened,
	operationFailed,
	operationStarted,
	operationSucceeded,
	remotesUpdated,
	removeBranch,
	requestCheckout,
	requestCommit,
	requestCreateBranch,
	requestFetch,
	requestInit,
	requestPull,
	requestPush,
	requestStatus,
	startGit,
	statusFailed,
	statusFetched,
} from '@beak/state/git';
import createFsEmitter, { type FsSubscription, scanDirectoryRecursively } from '@beak/ui/lib/fs-emitter';
import { ipcFsService } from '@beak/ui/lib/ipc';
import {
	gitCheckout,
	gitCommit,
	gitCreateBranch,
	gitFetch,
	gitFetchStatus,
	gitInit,
	gitListRemotes,
	gitPull,
	gitPush,
} from '@beak/ui/services/git';
import path from 'path-browserify';

import type { AppStartListening } from '../listener';

const headPrefix = path.join('refs', 'heads');
const headPrefixFs = path.join('.git', headPrefix);
const headFilePathFs = path.join('.git', 'HEAD');

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
				const remotes = await gitListRemotes();
				api.dispatch(remotesUpdated(remotes));
			} catch {
				/* not a git repo or read failed — silently skip */
			}
		},
	});

	start({
		actionCreator: requestInit,
		effect: async (action, api) => {
			const op: GitOperation = 'init';
			api.dispatch(operationStarted({ op }));
			try {
				const { branch, remotes } = await gitInit(action.payload);
				api.dispatch(
					gitOpened({
						branches: branch ? [{ name: branch }] : [],
						selectedBranch: branch ?? undefined,
					}),
				);
				api.dispatch(remotesUpdated(remotes));
				api.dispatch(operationSucceeded({ op, notice: branch ?? undefined }));
				api.dispatch(requestStatus());
			} catch (err) {
				api.dispatch(operationFailed({ op, error: err instanceof Error ? err.message : String(err) }));
			}
		},
	});

	start({
		actionCreator: requestStatus,
		effect: async (_action, api) => {
			try {
				api.dispatch(statusFetched(await gitFetchStatus()));
			} catch (err) {
				api.dispatch(statusFailed(err instanceof Error ? err.message : String(err)));
			}
		},
	});

	start({
		actionCreator: requestCommit,
		effect: async (action, api) => {
			const op: GitOperation = 'commit';
			api.dispatch(operationStarted({ op }));
			try {
				const { shortOid } = await gitCommit(action.payload);
				api.dispatch(operationSucceeded({ op, notice: shortOid }));
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
			api.dispatch(operationStarted({ op }));
			try {
				const result = await gitPush(action.payload);
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
			api.dispatch(operationStarted({ op }));
			try {
				await gitPull(action.payload);
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
			api.dispatch(operationStarted({ op }));
			try {
				await gitFetch(action.payload);
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
			api.dispatch(operationStarted({ op }));
			try {
				await gitCheckout(action.payload);
				api.dispatch(operationSucceeded({ op }));
				api.dispatch(requestStatus());
			} catch (err) {
				api.dispatch(operationFailed({ op, error: err instanceof Error ? err.message : String(err) }));
			}
		},
	});

	start({
		actionCreator: requestCreateBranch,
		effect: async (action, api) => {
			const op: GitOperation = 'branch';
			api.dispatch(operationStarted({ op }));
			try {
				await gitCreateBranch(action.payload);
				// fs-emitter on `.git/refs/heads` will pick up the new branch
				// shortly, but optimistically add it now so the dropdown shows
				// the result immediately.
				api.dispatch(addBranch(action.payload.ref));

				if (action.payload.checkout) {
					api.dispatch(requestCheckout({ ref: action.payload.ref }));
				}
				api.dispatch(operationSucceeded({ op, notice: `Created branch ${action.payload.ref}` }));
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
