import Squawk from '@beak/common/utils/squawk';
import { reloadExtensions, startExtensions } from '@beak/core/extensions';
import ksuid from '@beak/ksuid';
import { VariableManager } from '@beak/ui/features/variables';
import createFsEmitter, { type FsSubscription } from '@beak/ui/lib/fs-emitter';
import { ipcExtensionsService, ipcFsService } from '@beak/ui/lib/ipc';
import path from 'path-browserify';
import { extensionsOpened } from '../extensions/actions';
import type { Extension, FailedExtension } from '../extensions/types';
import type { AppStartListening } from '../listener';
import { alertInsert, alertRemoveType } from '../project/actions';

interface PackageJson {
	name: string;
	version: string;
	dependencies: Record<string, string> | undefined;
	beakExtensionType: string;
}

export function registerExtensionsEffects(start: AppStartListening) {
	let subscription: FsSubscription | undefined;

	start({
		actionCreator: startExtensions,
		effect: async (_action, api) => {
			await initialImport(api);

			subscription?.close();
			subscription = createFsEmitter(
				'extensions',
				async event => {
					if (!['add', 'change', 'unlink'].includes(event.type)) return;
					// TODO(afr): make this more intelligent sometime
					await initialImport(api);
				},
				{ depth: 0, followSymlinks: false },
			);
		},
	});

	start({
		actionCreator: reloadExtensions,
		effect: async (_action, api) => {
			await initialImport(api);
		},
	});
}

async function initialImport(api: { dispatch: (a: { type: string; [k: string]: unknown }) => unknown }) {
	const hasExtensions = await ipcFsService.pathExists('extensions');
	if (!hasExtensions) return;

	const extensions = await readExtensions();
	const invalidExtensions = extensions.filter(e => !e.valid) as FailedExtension[];

	api.dispatch(alertRemoveType('invalid_extension'));
	api.dispatch(extensionsOpened({ extensions }));

	for (const invalid of invalidExtensions) {
		const dir = path.dirname(invalid.filePath);
		const lastDirIndex = dir.lastIndexOf(path.sep) + 1;
		const lastDir = dir.substring(lastDirIndex);

		api.dispatch(
			alertInsert({
				ident: ksuid.generate('alert').toString(),
				alert: {
					type: 'invalid_extension',
					payload: {
						error: invalid.error,
						assumedName: lastDir,
						filePath: invalid.filePath,
					},
				},
			}),
		);
	}
}

async function readExtensions(): Promise<Extension[]> {
	const packagePath = path.join('extensions', 'package.json');
	const lockPath = path.join('extensions', 'yarn.lock');

	const packageExists = await ipcFsService.pathExists(packagePath);
	const lockExists = await ipcFsService.pathExists(lockPath);

	if (!packageExists || !lockExists) return [];

	const packageJson = await ipcFsService.readJson<PackageJson>(packagePath);

	if (!packageJson.dependencies) return [];

	const dependencies = (await ipcFsService.readText(lockPath))
		.split('\n')
		.filter(l => l.startsWith('"'))
		.map(l => {
			const closeIndex = l.lastIndexOf('@');
			return l.substring(1, closeIndex);
		});

	const extensions = await Promise.all(
		dependencies.map<Promise<Extension | null>>(async k => {
			const dependencyPath = path.join('extensions', 'node_modules', k);
			const packagePath = path.join(dependencyPath, 'package.json');
			const packageExists = await ipcFsService.pathExists(packagePath);

			if (!packageExists) return null;

			const packageJson = await ipcFsService.readJson<PackageJson>(packagePath);

			// TODO(afr): Parse this properly, with validation
			const { beakExtensionType } = packageJson;
			if (!beakExtensionType) return null;

			try {
				const extension = await ipcExtensionsService.registerRtv({ extensionFilePath: dependencyPath });
				VariableManager.registerExternalRealtimeValue(extension);
				return extension;
			} catch (error) {
				return {
					filePath: packagePath,
					valid: false,
					error: Squawk.coerce(error),
				};
			}
		}),
	);

	return extensions.filter(Boolean) as Extension[];
}
