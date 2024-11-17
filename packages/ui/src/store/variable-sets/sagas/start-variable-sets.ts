import { TypedObject } from '@beak/common/helpers/typescript';
import { EditorPreferences } from '@beak/common/types/beak-hub';
import { attemptReconciliation } from '@beak/ui/features/tabs/store/actions';
import { readVariableSet } from '@beak/ui/lib/beak-variable-set';
import createFsEmitter, { scanDirectoryRecursively, ScanResult } from '@beak/ui/lib/fs-emitter';
import { ipcDialogService, ipcFsService } from '@beak/ui/lib/ipc';
import type { VariableSets } from '@getbeak/types/variable-sets';
import { call, put, select, take } from '@redux-saga/core/effects';
import path from 'path-browserify';

import { ApplicationState } from '../..';
import { editorPreferencesSetSelectedVariableSet } from '../../preferences/actions';
import * as actions from '../actions';

interface Emitter {
	type: 'ready' | 'add' | 'change' | 'unlink';
	path: string;
}

export default function* workerStartVariableSets() {
	const channel = createFsEmitter('variable-sets', { depth: 0, followSymlinks: false });

	yield initialImport('variable-sets');

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
			const lastWrite: number = yield select((s: ApplicationState) => s.global.variableSets.latestWrite);

			if (lastWrite) {
				const now = Date.now();
				const expiry = lastWrite + 1000; // 1 second

				if (expiry > now)
					continue;
			}
		}

		if (['add', 'change'].includes(result.type)) {
			try {
				const { file, name } = yield call(readVariableSet, result.path);

				yield put(actions.insertNewVariableSet({ id: name, variableSet: file }));
			} catch (error) {
				if (!(error instanceof Error))
					return;

				yield call([ipcDialogService, ipcDialogService.showMessageBox], {
					type: 'error',
					title: 'Project data error',
					message: 'There was a problem reading a variable set file in your project',
					detail: [
						error.message,
						error.stack,
					].join('\n'),
				});
			}
		} else if (result.type === 'unlink') {
			try {
				const variableSetName = path.basename(result.path, path.extname(result.path));

				yield put(actions.removeVariableSetFromStore(variableSetName));
				yield put(attemptReconciliation());
			} catch (error) {
				if (!(error instanceof Error))
					return;

				yield call([ipcDialogService, ipcDialogService.showMessageBox], {
					type: 'error',
					title: 'Project data error',
					message: 'There was a problem deleting a variable set from your project',
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
	const folderExists: boolean = yield call([ipcFsService, ipcFsService.pathExists], 'variable-sets');

	if (!folderExists) {
		yield put(actions.variableSetsOpened({ variableSets: {} }));

		return;
	}

	const items: ScanResult[] = yield scanDirectoryRecursively(vgPath);
	const files = items.filter(i => !i.isDirectory).map(i => i.path);
	const variableSets: VariableSets = yield call(readVariableSets, files);
	const editorPreferences: EditorPreferences = yield select((s: ApplicationState) => s.global.preferences.editor);

	for (const vgk of TypedObject.keys(variableSets)) {
		const vg = variableSets[vgk];

		if (editorPreferences.selectedVariableSets[vgk] === void 0) {
			yield put(editorPreferencesSetSelectedVariableSet({
				variableSet: vgk,
				setId: TypedObject.keys(vg.sets)[0],
			}));
		}
	}

	yield put(actions.variableSetsOpened({ variableSets }));
}

async function readVariableSets(filePaths: string[]) {
	const results = await Promise.all(filePaths.map(f => readVariableSet(f)));

	return results.reduce((acc, { name, file }) => ({
		...acc,
		[name]: file,
	}), {});
}
