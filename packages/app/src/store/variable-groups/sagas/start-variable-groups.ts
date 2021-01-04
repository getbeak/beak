import { readVariableGroup } from '@beak/app/lib/beak-variable-group';
import { PayloadAction } from '@reduxjs/toolkit';
import { eventChannel } from 'redux-saga';
import { call, put, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import * as actions from '../actions';

const { remote } = window.require('electron');
const chokidar = remote.require('chokidar');
const fs = remote.require('fs-extra');
const path = remote.require('path');

interface Emitter {
	type: 'ready' | 'add' | 'change' | 'unlink';
	path: string;
}

export default function* workerStartVariableGroups({ payload }: PayloadAction<string>) {
	const projectPath = payload;
	const vgPath = path.join(projectPath, 'variable-groups');

	yield put(actions.variableGroupsInfo({ variableGroupsPath: vgPath }));

	const channel = eventChannel(emitter => {
		const watcher = chokidar
			.watch(vgPath, { followSymlinks: false })
			.on('all', (event, path) => emitter({ type: event, path }))
			.on('ready', () => emitter({ type: 'ready' }))
			.on('error', console.error);

		return () => {
			watcher.close();
		};
	});

	while (true) {
		const result: Emitter = yield take(channel);
		const initScan: string[] | null = yield select((s: ApplicationState) => s.global.variableGroups.initialScan);
		const isInitialScan = initScan !== null;

		if (result === null)
			break;

		if (result.type === 'ready') {
			yield put(actions.initialScanComplete(initScan!));
			// TODO(afr): Set selected items

			continue;
		}

		// Only listen to files
		if (!['add', 'change', 'unlink'].includes(result.type))
			continue;

		// Skip non json files
		if (path.extname(result.path) !== '.json')
			continue;

		if (isInitialScan) {
			yield put(actions.insertScanItem(result.path));

			continue;
		}

		if (['add', 'change'].includes(result.type)) {
			const { file, name } = yield call(readVariableGroup, result.path);

			yield put(actions.updateVg({ name, file }));
		} else if (result.type === 'unlink') {
			const vgName = path.basename(result.path, path.extname(result.path));

			yield put(actions.removeVg(vgName));
		}
	}
}
