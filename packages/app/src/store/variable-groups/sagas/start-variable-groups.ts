import { readVariableGroup } from '@beak/app/lib/beak-variable-group';
import createFsEmitter, { scanDirectoryRecursively, ScanResult } from '@beak/app/lib/fs-emitter';
import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableGroups } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import * as actions from '../actions';

const { remote } = window.require('electron');
const path = remote.require('path');

interface Emitter {
	type: 'ready' | 'add' | 'change' | 'unlink';
	path: string;
}

export default function* workerStartVariableGroups({ payload }: PayloadAction<string>) {
	const projectPath = payload;
	const vgPath = path.join(projectPath, 'variable-groups');
	const channel = createFsEmitter(vgPath, { depth: 0, followSymlinks: false });

	yield put(actions.variableGroupsInfo({ variableGroupsPath: vgPath }));
	yield initialImport(vgPath);

	while (true) {
		const result: Emitter = yield take(channel);

		if (result === null)
			break;

		// Only listen to files
		if (!['add', 'change', 'unlink'].includes(result.type))
			continue;

		// Skip non json files
		if (path.extname(result.path) !== '.json')
			continue;

		// Protection to only read changes if they haven't been recently written by Beak
		if (result.type === 'change') {
			const lastWrite: number = yield select((s: ApplicationState) => s.global.variableGroups.latestWrite);

			if (lastWrite) {
				const now = Date.now();
				const expiry = lastWrite + 1000; // 1 second

				if (expiry > now)
					continue;
			}
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

function* initialImport(vgPath: string) {
	const items: ScanResult[] = yield scanDirectoryRecursively(vgPath);
	const variableGroups: VariableGroups = yield call(readVariableGroups, items
		.filter(i => !i.isDirectory).map(i => i.path),
	);

	for (const vgk of TypedObject.keys(variableGroups)) {
		const vg = variableGroups[vgk];

		yield put(actions.changeSelectedGroup({
			variableGroup: vgk,
			group: TypedObject.keys(vg.groups)[0],
		}));
	}

	yield put(actions.variableGroupsOpened(variableGroups));
}

async function readVariableGroups(filePaths: string[]) {
	const results = await Promise.all(filePaths.map(f => readVariableGroup(f)));

	return results.reduce((acc, { name, file }) => ({
		...acc,
		[name]: file,
	}), {});
}
