import Squawk from '@beak/common/utils/squawk';
import ksuid from '@beak/ksuid';
import { RealtimeValueManager } from '@beak/ui/features/realtime-values';
import createFsEmitter from '@beak/ui/lib/fs-emitter';
import { ipcExtensionsService, ipcFsService } from '@beak/ui/lib/ipc';
import { call, put, take } from '@redux-saga/core/effects';
import { Action } from '@reduxjs/toolkit';
import path from 'path-browserify';

import { alertInsert, alertRemoveType } from '../../project/actions';
import * as actions from '../actions';
import { ActionTypes, Extension, FailedExtension } from '../types';

interface PackageJson {
	name: string;
	version: string;
	dependencies: Record<string, string> | undefined;
	beakExtensionType: string;
}

interface Emitter {
	type: 'add' | 'change' | 'unlink';
	path: string;
}

export default function* workerStartExtensions(action: Action) {
	if (action.type === ActionTypes.RELOAD_EXTENSIONS) {
		yield initialImport();

		return;
	}

	const channel = createFsEmitter('extensions', {
		depth: 0,
		followSymlinks: false,
	});

	yield initialImport();

	while (true) {
		const result: Emitter = yield take(channel);

		if (result === null)
			break;

		// Only listen to files
		if (!['add', 'change', 'unlink'].includes(result.type))
			continue;

		// TODO(afr): make this more intelligent sometime
		yield call(initialImport);
	}
}

function* initialImport() {
	const hasExtensions: boolean = yield call([ipcFsService, ipcFsService.pathExists], 'extensions');

	if (!hasExtensions)
		return;

	const extensions: Extension[] = yield call(readExtensions);
	const invalidExtensions = extensions.filter(e => !e.valid) as FailedExtension[];

	yield put(alertRemoveType('invalid_extension'));
	yield put(actions.extensionsOpened({ extensions }));

	for (const invalid of invalidExtensions) {
		const dir = path.dirname(invalid.filePath);
		const lastDirIndex = dir.lastIndexOf(path.sep) + 1;
		const lastDir = dir.substring(lastDirIndex);

		yield put(alertInsert({
			ident: ksuid.generate('alert').toString(),
			alert: {
				type: 'invalid_extension',
				payload: {
					error: invalid.error,
					assumedName: lastDir,
					filePath: invalid.filePath,
				},
			},
		}));
	}
}

async function readExtensions(): Promise<Extension[]> {
	const packagePath = path.join('extensions', 'package.json');
	const lockPath = path.join('extensions', 'yarn.lock');

	const packageExists = await ipcFsService.pathExists(packagePath);
	const lockExists = await ipcFsService.pathExists(lockPath);

	if (!packageExists || !lockExists)
		return [];

	const packageJson = await ipcFsService.readJson<PackageJson>(packagePath);

	if (!packageJson.dependencies)
		return [];

	const dependencies = (await ipcFsService.readText(lockPath)).split('\n')
		.filter(l => l.startsWith('"'))
		.map(l => {
			const closeIndex = l.lastIndexOf('@');

			return l.substring(1, closeIndex);
		});

	const extensions = await Promise.all(dependencies.map<Promise<Extension | null>>(async k => {
		const dependencyPath = path.join('extensions', 'node_modules', k);
		const packagePath = path.join(dependencyPath, 'package.json');
		const packageExists = await ipcFsService.pathExists(packagePath);

		if (!packageExists)
			return null;

		const packageJson = await ipcFsService.readJson<PackageJson>(packagePath);

		// TODO(afr): Parse this properly, with validation
		const { beakExtensionType } = packageJson;

		if (!beakExtensionType)
			return null;

		try {
			const extension = await ipcExtensionsService.registerRtv({ extensionFilePath: dependencyPath });

			RealtimeValueManager.registerExternalRealtimeValue(extension);

			return extension;
		} catch (error) {
			return {
				filePath: packagePath,
				valid: false,
				error: Squawk.coerce(error),
			};
		}
	}));

	return extensions.filter(Boolean) as Extension[];
}
