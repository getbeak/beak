import { readFolderNode } from '@beak/app/lib/beak-project/folder';
import { readProjectFile } from '@beak/app/lib/beak-project/project';
import { readRequestNode } from '@beak/app/lib/beak-project/request';
import { ApplicationState } from '@beak/app/src/store';
import actions from '@beak/app/src/store/project/actions';
import { ProjectFile } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { eventChannel } from 'redux-saga';
import { call, put, select, take } from 'redux-saga/effects';

import { startVariableGroups } from '../../variable-groups/actions';
import { ScanEntryPayload } from '../types';

const { remote } = window.require('electron');
const chokidar = remote.require('chokidar');
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

	// TODO(afr): Read project file
	yield put(actions.insertProjectInfo({
		projectPath,
		treePath: projectTreePath,
		name: project.name,
	}));
	yield put(startVariableGroups(projectPath));

	const channel = eventChannel(emitter => {
		const watcher = chokidar
			.watch(projectTreePath, { followSymlinks: false })
			.on('all', (event, path) => emitter({ type: event, path }))
			.on('ready', () => emitter({ type: 'ready' }))
			.on('error', console.error);

		return () => {
			watcher.close();
		};
	});

	while (true) {
		const result: Event = yield take(channel);
		const initScan: ScanEntryPayload[] | null = yield select((s: ApplicationState) => s.global.project.initialScan);
		const isInitialScan = initScan !== null;

		if (result === null)
			break;

		if (result.type === 'ready') {
			yield put(actions.initialScanComplete({ entries: initScan! }));
			// TODO(afr): Set selected request

			continue;
		}

		const isDirectory = ['addDir', 'unlinkDir'].includes(result.type);

		// Skip and non json files
		if (!isDirectory && path.extname(result.path) !== '.json')
			continue;

		if (isInitialScan) {
			yield put(actions.insertScanItem({
				filePath: result.path,
				isDirectory,
			}));

			continue;
		}

		if (isDirectory)
			yield handleFolder(result);
		else
			yield handleRequest(result);
	}
}

function* handleRequest(event: Event) {
	switch (event.type) {
		case 'add':
		case 'change': {
			const node = yield call(readRequestNode, event.path);

			yield put(actions.insertRequestNode(node));

			break;
		}

		case 'unlink':
			yield put(actions.removeNodeByFilePath(event.path));

			break;

		default:
			console.warn('Unknown listener type for folder:', event.type);

			break;
	}
}

function* handleFolder(event: Event) {
	switch (event.type) {
		case 'addDir': {
			const node = yield call(readFolderNode, event.path);

			yield put(actions.insertFolderNode(node));

			break;
		}

		case 'unlinkDir':
			yield put(actions.removeNodeByFilePath(event.path));

			break;

		default:
			console.warn('Unknown listener type for folder:', event.type);

			break;
	}
}
