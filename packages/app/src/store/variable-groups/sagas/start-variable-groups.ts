import { attemptReconciliation } from '@beak/app/features/tabs/store/actions';
import { readVariableGroup } from '@beak/app/lib/beak-variable-group';
import createFsEmitter, { scanDirectoryRecursively, ScanResult } from '@beak/app/lib/fs-emitter';
import { ipcDialogService, ipcFsService } from '@beak/app/lib/ipc';
import { TypedObject } from '@beak/common/helpers/typescript';
import { EditorPreferences } from '@beak/common/types/beak-hub';
import type { VariableGroups } from '@getbeak/types/variable-groups';
import path from 'path-browserify';
import { call, put, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { editorPreferencesSetSelectedVariableGroup } from '../../preferences/actions';
import * as actions from '../actions';

interface Emitter {
	type: 'ready' | 'add' | 'change' | 'unlink';
	path: string;
}

export default function* workerStartVariableGroups() {
	const channel = createFsEmitter('variable-groups', { depth: 0, followSymlinks: false });

	yield initialImport('variable-groups');

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
			try {
				const { file, name } = yield call(readVariableGroup, result.path);

				yield put(actions.insertNewVariableGroup({ id: name, variableGroup: file }));
			} catch (error) {
				if (!(error instanceof Error))
					return;

				yield call([ipcDialogService, ipcDialogService.showMessageBox], {
					type: 'error',
					title: 'Project data error',
					message: 'There was a problem reading a variable group file in your project',
					detail: [
						error.message,
						error.stack,
					].join('\n'),
				});
			}
		} else if (result.type === 'unlink') {
			try {
				const variableGroupName = path.basename(result.path, path.extname(result.path));

				yield put(actions.removeVariableGroupFromStore(variableGroupName));
				yield put(attemptReconciliation());
			} catch (error) {
				if (!(error instanceof Error))
					return;

				yield call([ipcDialogService, ipcDialogService.showMessageBox], {
					type: 'error',
					title: 'Project data error',
					message: 'There was a problem deleting a variable group from your project',
					detail: [
						error.message,
						error.stack,
					].join('\n'),
				});
			}
		}
	}
}

function* initialImport(vgPath: string) {
	const folderExists: boolean = yield call([ipcFsService, ipcFsService.pathExists], 'variable-groups');

	if (!folderExists) {
		yield put(actions.variableGroupsOpened({ variableGroups: {} }));

		return;
	}

	const items: ScanResult[] = yield scanDirectoryRecursively(vgPath);
	const files = items.filter(i => !i.isDirectory).map(i => i.path);
	const variableGroups: VariableGroups = yield call(readVariableGroups, files);
	const editorPreferences: EditorPreferences = yield select((s: ApplicationState) => s.global.preferences.editor);

	for (const vgk of TypedObject.keys(variableGroups)) {
		const vg = variableGroups[vgk];

		if (editorPreferences.selectedVariableGroups[vgk] === void 0) {
			yield put(editorPreferencesSetSelectedVariableGroup({
				variableGroup: vgk,
				groupId: TypedObject.keys(vg.groups)[0],
			}));
		}
	}

	yield put(actions.variableGroupsOpened({ variableGroups }));
}

async function readVariableGroups(filePaths: string[]) {
	const results = await Promise.all(filePaths.map(f => readVariableGroup(f)));

	return results.reduce((acc, { name, file }) => ({
		...acc,
		[name]: file,
	}), {});
}
