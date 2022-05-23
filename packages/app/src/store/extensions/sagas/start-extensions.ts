import createFsEmitter from '@beak/app/lib/fs-emitter';
import { ipcFsService } from '@beak/app/lib/ipc';
import path from 'path-browserify';
import { call, put, take } from 'redux-saga/effects';

import * as actions from '../actions';
import { Extension } from '../types';

interface PackageJson {
	name: string;
	version: string;
	dependencies: Record<string, string> | undefined;
}

interface Emitter {
	type: 'add' | 'change' | 'unlink';
	path: string;
}

export default function* workerStartExtensions() {
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
		const extensions: Extension[] = yield call(readExtensions);

		yield put(actions.extensionsOpened({ extensions }));
	}
}

function* initialImport() {
	const hasExtensions: boolean = yield call([ipcFsService, ipcFsService.pathExists], 'extensions');

	if (!hasExtensions)
		return;

	const extensions: Extension[] = yield call(readExtensions);

	yield put(actions.extensionsOpened({ extensions }));
}

// Read lock file
// Read each package name and version
// Read each package package.json
// Store in store

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

	return await Promise.all(dependencies.map<Promise<Extension>>(async k => {
		const dependencyPath = path.join('extensions', 'node_modules', k);
		const packagePath = path.join(dependencyPath, 'package.json');
		const packageExists = await ipcFsService.pathExists(packagePath);

		if (!packageExists)
			return { filePath: packagePath, valid: false };

		const packageJson = await ipcFsService.readJson<PackageJson>(packagePath);

		// TODO(afr): Add `package.json` validation
		// if (!packageJson.[fields])
		// 	return { valid: false };

		return {
			filePath: packagePath,
			id: `${packageJson.name}@${packageJson.version}`,
			name: packageJson.name,
			version: packageJson.version,
			valid: true,
		};
	}));
}
