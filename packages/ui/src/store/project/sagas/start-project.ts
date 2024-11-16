import Squawk from '@beak/common/utils/squawk';
import ksuid from '@beak/ksuid';
import { attemptReconciliation, closeTab, loadTabState } from '@beak/ui/features/tabs/store/actions';
import { readFolderNode } from '@beak/ui/lib/beak-project/folder';
import { readProjectFile } from '@beak/ui/lib/beak-project/project';
import { readRequestNode } from '@beak/ui/lib/beak-project/request';
import createFsEmitter, { scanDirectoryRecursively, ScanResult } from '@beak/ui/lib/fs-emitter';
import { ipcDialogService, ipcEncryptionService, ipcWindowService } from '@beak/ui/lib/ipc';
import actions, { alertInsert } from '@beak/ui/store/project/actions';
import type { FolderNode, RequestNode, Tree } from '@getbeak/types/nodes';
import type { ProjectFile } from '@getbeak/types/project';
import { EventChannel } from '@redux-saga/core';
import { call, put, select, take } from '@redux-saga/core/effects';
import path from 'path-browserify';

import { ApplicationState } from '../..';
import { startVariableGroups } from '../../variable-groups/actions';
import { LatestWrite } from '../types';

interface Event {
	type: 'ready' | 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
	path: string;
}

export default function* workerStartProject() {
	let project: ProjectFile;
	let channel: EventChannel<Record<string, unknown> | null>;

	try {
		// TODO(afr): Listen to this file too
		project = yield call(readProjectFile);
		channel = createFsEmitter('tree', { followSymlinks: false });

		yield put(actions.insertProjectInfo({ id: project.id, name: project.name }));
		yield put(startVariableGroups());
		yield initialImport('tree');
		yield put(loadTabState());
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'Legacy project detected') {
				yield call([ipcDialogService, ipcDialogService.showMessageBox], {
					type: 'warning',
					title: 'Unsupported project version',
					message: 'The project you opened is no longer supported by Beak, it should have been automatically updated.',
					detail: 'Message @beakapp on twitter for support.',
				});
			} else if (error.message === 'Future project detected') {
				yield call([ipcDialogService, ipcDialogService.showMessageBox], {
					type: 'warning',
					title: 'Unsupported project version',
					message: 'The project you opened can\'t be opened by this version of Beak. Please check for updates and try again.',
					detail: 'Message @beakapp on twitter for support.',
				});
			}
		}

		const squawk = Squawk.coerce(error);

		yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			type: 'error',
			title: 'Project failed to open',
			message: 'There was a problem loading the Beak project.',
			detail: [
				squawk.message,
				squawk.stack,
			].join('\n'),
		});

		yield call([ipcWindowService, ipcWindowService.closeSelfWindow]);

		return;
	}

	// Check encryption status
	const encryptionStatus: boolean = yield call([ipcEncryptionService, ipcEncryptionService.checkStatus]);

	if (!encryptionStatus) {
		yield put(alertInsert({
			ident: ksuid.generate('alert').toString(),
			alert: { type: 'missing_encryption' },
		}));
	}

	while (true) {
		const result: Event = yield take(channel);

		if (result === null)
			break;

		const isDirectory = ['addDir', 'unlinkDir'].includes(result.type);

		// Skip non-directories and non-json files
		if (!isDirectory && path.extname(result.path) !== '.json')
			continue;

		try {
			if (isDirectory)
				yield handleFolder(result);
			else
				yield handleRequest(result);
		} catch (error) {
			if (!(error instanceof Error))
				return;

			yield call([ipcDialogService, ipcDialogService.showMessageBox], {
				type: 'error',
				title: 'Project data error',
				message: 'There was a problem reading a file or directory in your project',
				detail: [
					error.message,
					error.stack,
				].join('\n'),
			});
		}
	}
}

function* initialImport(treePath: string) {
	const items: ScanResult[] = yield scanDirectoryRecursively(treePath);

	const folders = items.filter(s => s.isDirectory);
	const requests = items.filter(s => !s.isDirectory);

	const folderNodes: Record<string, FolderNode> = yield call(readFolderNodes, folders);
	const requestNodes: Record<string, RequestNode> = yield call(readRequestNodes, requests);
	const tree: Tree = {
		...folderNodes,
		...requestNodes,
	};

	yield put(actions.projectOpened({ tree }));
}

async function readFolderNodes(folders: ScanResult[]) {
	if (folders.length === 0)
		return null;

	const results = await Promise.all(folders.map(f => readFolderNode(f.path)));

	return results.reduce((acc, val) => ({
		...acc,
		[val.id]: val,
	}), {}) as Record<string, FolderNode>;
}

async function readRequestNodes(requests: ScanResult[]) {
	if (requests.length === 0)
		return null;

	const results = await Promise.all(requests.map(f => readRequestNode(f.path)));

	return results.reduce((acc, val) => ({
		...acc,
		[val.id]: val,
	}), {}) as Record<string, RequestNode>;
}

function* handleFolder(event: Event) {
	switch (event.type) {
		case 'addDir': {
			const node: FolderNode = yield call(readFolderNode, event.path);
			const existingNode: FolderNode = yield select((s: ApplicationState) => s.global.project.tree[node.id]);

			// This is to avoid a re-rendering bug due to chokidar firing this event for seemingly no reason.
			if (existingNode)
				return;

			yield put(actions.insertFolderNode(node));

			break;
		}

		case 'unlinkDir':
			yield put(actions.removeNodeFromStoreByPath(event.path));
			yield put(attemptReconciliation());

			break;

		default:

			console.warn('Unknown listener type for folder:', event.type);

			break;
	}
}

function* handleRequest(event: Event) {
	const tree: Tree = yield select((s: ApplicationState) => s.global.project.tree);

	// Protection to only read changes if they haven't been recently written by Beak
	if (event.type === 'change') {
		const lastWrite: LatestWrite = yield select((s: ApplicationState) => s.global.project.latestWrite);

		if (lastWrite && lastWrite.filePath === event.path) {
			const now = Date.now();
			const expiry = lastWrite.writtenAt + 1000;

			if (expiry > now)
				return;
		}
	}

	switch (event.type) {
		case 'change':
		case 'add': {
			const node: RequestNode = yield call(readRequestNode, event.path);

			yield put(actions.insertRequestNode(node));

			break;
		}

		case 'unlink': {
			const node = Object.values(tree).find(n => n.filePath === event.path);

			if (node)
				yield put(closeTab(node.id));

			yield put(actions.removeNodeFromStoreByPath(event.path));
			yield put(attemptReconciliation());

			break;
		}

		default:

			console.warn('Unknown listener type for folder:', event.type);

			break;
	}
}
