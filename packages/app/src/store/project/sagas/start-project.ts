import { readFolderNode } from '@beak/app/lib/beak-project/folder';
import { readProjectFile } from '@beak/app/lib/beak-project/project';
import { readRequestNode } from '@beak/app/lib/beak-project/request';
import createFsEmitter, { scanDirectoryRecursively, ScanResult } from '@beak/app/lib/fs-emitter';
import actions from '@beak/app/src/store/project/actions';
import { TypedObject } from '@beak/common/helpers/typescript';
import { FolderNode, ProjectFile, RequestNode, Tree } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, select, take } from 'redux-saga/effects';
import { ApplicationState } from '../..';

import { startVariableGroups } from '../../variable-groups/actions';
import { LatestWrite } from '../types';

const { remote } = window.require('electron');
const path = remote.require('path');

interface Event {
	type: 'ready' | 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
	path: string;
}

export default function* workerStartProject({ payload }: PayloadAction<string>) {
	const projectFilePath = payload;
	const projectPath = path.join(projectFilePath, '..');
	const projectTreePath = path.join(projectPath, 'tree');

	// TODO(afr): Listen to this file too
	const project: ProjectFile = yield call(readProjectFile, projectPath);
	const channel = createFsEmitter(projectTreePath, { followSymlinks: false });

	yield put(actions.insertProjectInfo({
		projectPath,
		treePath: projectTreePath,
		name: project.name,
	}));
	yield put(startVariableGroups(projectPath));
	yield initialImport(projectTreePath);

	while (true) {
		const result: Event = yield take(channel);

		if (result === null)
			break;

		const isDirectory = ['addDir', 'unlinkDir'].includes(result.type);

		// Skip and non json files
		if (!isDirectory && path.extname(result.path) !== '.json')
			continue;

		if (isDirectory)
			yield handleFolder(result);
		else
			yield handleRequest(result);
	}
}

function* initialImport(treePath: string) {
	const items: ScanResult[] = yield scanDirectoryRecursively(treePath);

	const folders = items.filter(s => s.isDirectory);
	const requests = items.filter(s => !s.isDirectory);

	const folderNodes: Record<string, FolderNode> = yield call(readFolderNodes, folders);
	const requestNodes: Record<string, RequestNode> = yield call(readRequestNodes, requests);
	const firstRequest = TypedObject.values(requestNodes)[0];
	const tree: Tree = {
		...folderNodes,
		...requestNodes,
	};

	// TODO(afr): Read previously tab state from the history in the hub.
	if (firstRequest)
		yield put(actions.tabSelected({ type: 'request', payload: firstRequest.id, temporary: false }));

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
			const node = yield call(readFolderNode, event.path);

			yield put(actions.insertFolderNode(node));

			break;
		}

		case 'unlinkDir':
			yield put(actions.removeNodeFromStoreByPath(event.path));

			break;

		default:
			console.warn('Unknown listener type for folder:', event.type);

			break;
	}
}

function* handleRequest(event: Event) {
	// Protection to only read changes if they haven't been recently written by Beak
	if (event.type === 'change') {
		const lastWrite: LatestWrite = yield select((s: ApplicationState) => s.global.project.latestWrite);

		if (lastWrite && lastWrite.filePath === event.path) {
			const now = Date.now();
			const expiry = lastWrite.writtenAt + 1000;

			if (expiry < now)
				return;
		}
	}

	switch (event.type) {
		case 'change':
		case 'add': {
			const node = yield call(readRequestNode, event.path);

			yield put(actions.insertRequestNode(node));

			break;
		}

		case 'unlink':
			yield put(actions.removeNodeFromStoreByPath(event.path));

			break;

		default:
			console.warn('Unknown listener type for folder:', event.type);

			break;
	}
}
