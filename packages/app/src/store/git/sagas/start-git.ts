import createFsEmitter, { scanDirectoryRecursively, ScanResult } from '@beak/app/lib/fs-emitter';
import { ipcFsService } from '@beak/app/lib/ipc';
import path from 'path-browserify';
import { call, put, take } from 'redux-saga/effects';

import * as actions from '../actions';

interface Emitter {
	type: 'add' | 'change' | 'unlink';
	path: string;
}

const headPrefix = path.join('refs', 'heads');
const headPrefixFs = path.join('.git', headPrefix);
const headFilePathFs = path.join('.git', 'HEAD');

export default function* workerStartGit() {
	const channel = createFsEmitter('.git', { depth: 0, followSymlinks: false });

	yield initialImport();

	while (true) {
		const result: Emitter = yield take(channel);

		if (result === null)
			break;

		// Only listen to files
		if (!['add', 'change', 'unlink'].includes(result.type))
			continue;

		if (['add', 'change'].includes(result.type)) {
			const isHeadFile = result.path === headFilePathFs;
			const isHeadRef = result.path.startsWith(headPrefixFs);

			if (isHeadRef) {
				const branch = result.path.slice(headPrefixFs.length + 1);

				yield put(actions.addBranch(branch));
			} else if (isHeadFile) {
				const branch: string | undefined = yield call(parsePointerFile, result.path);

				yield put(actions.changeSelectedBranch(branch));
			}
		} else if (result.type === 'unlink') {
			if (!result.path.startsWith(headPrefixFs))
				return;

			const branch = result.path.slice(headPrefixFs.length + 1);

			yield put(actions.removeBranch(branch));
		}
	}
}

function* initialImport() {
	const hasGit: boolean = yield call([ipcFsService, ipcFsService.pathExists], '.git');

	if (!hasGit)
		return;

	const items: ScanResult[] = yield scanDirectoryRecursively('.git', true);
	const files = items.filter(i => !i.isDirectory).map(i => i.path);
	const heads = files.filter(f => f.startsWith(headPrefixFs)).map(f => f.slice(headPrefixFs.length + 1));
	const headFilePath = files.find(f => f === path.join('.git', 'HEAD'));

	if (!headFilePath)
		return;

	yield put(actions.gitOpened({
		branches: heads.map(h => ({ name: h })),
		selectedBranch: yield call(parsePointerFile, headFilePath),
	}));
}

async function parsePointerFile(path: string) {
	const file = await ipcFsService.readText(path);
	const parts = file.trim().match(/^(.+): (.+)\/(.+)\/(.+)$/);

	if (!parts || parts[1] !== 'ref' || parts[3] !== 'heads')
		return void 0;

	return parts[4];
}
