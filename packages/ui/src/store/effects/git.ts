import { startGit } from '@beak/core/git';
import createFsEmitter, { type FsSubscription, scanDirectoryRecursively } from '@beak/ui/lib/fs-emitter';
import { ipcFsService } from '@beak/ui/lib/ipc';
import path from 'path-browserify';

import { addBranch, changeSelectedBranch, gitOpened, removeBranch } from '../git/actions';
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
				{ depth: 0, followSymlinks: false },
			);

			void subscription;
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
	const parts = file.trim().match(/^(.+): (.+)\/(.+)\/(.+)$/);

	if (!parts || parts[1] !== 'ref' || parts[3] !== 'heads') return void 0;

	return parts[4];
}
