import Squawk from '@beak/common/utils/squawk';
import ksuid from '@beak/ksuid';
import {
	checkExtensionUpdates,
	extensionRemoved,
	extensionsLoaded,
	extensionUpsert,
	installExtension,
	operationChanged,
	reloadExtensions,
	removeExtension,
	searchExtensions,
	searchStateChanged,
	startExtensions,
	updateExtension,
	updatesAvailable,
} from '@beak/state/extensions';
import { VariableManager } from '@beak/ui/features/variables';
import { ipcExtensionsService } from '@beak/ui/lib/ipc';

import type { AppStartListening } from '../listener';
import { alertInsert, alertRemoveType } from '../project/actions';

export function registerExtensionsEffects(start: AppStartListening) {
	start({
		actionCreator: startExtensions,
		effect: async (_action, api) => {
			await loadAll(api);
		},
	});

	start({
		actionCreator: reloadExtensions,
		effect: async (_action, api) => {
			await loadAll(api);
		},
	});

	start({
		actionCreator: installExtension,
		effect: async ({ payload }, api) => {
			const { packageName, versionRange } = payload;

			api.dispatch(
				operationChanged({
					packageName,
					operation: { kind: 'install', status: 'pending', version: versionRange },
				}),
			);

			try {
				const extension = await ipcExtensionsService.install({ packageName, versionRange });
				VariableManager.registerExtension(extension);
				api.dispatch(extensionUpsert({ extension }));
				api.dispatch(operationChanged({ packageName, operation: null }));
			} catch (error) {
				api.dispatch(
					operationChanged({
						packageName,
						operation: { kind: 'install', status: 'failed', error: Squawk.coerce(error) },
					}),
				);
			}
		},
	});

	start({
		actionCreator: removeExtension,
		effect: async ({ payload }, api) => {
			const { packageName } = payload;

			api.dispatch(
				operationChanged({
					packageName,
					operation: { kind: 'remove', status: 'pending' },
				}),
			);

			try {
				await ipcExtensionsService.remove({ packageName });
				VariableManager.unregisterExtension(packageName);
				api.dispatch(extensionRemoved({ packageName }));
				api.dispatch(operationChanged({ packageName, operation: null }));
			} catch (error) {
				api.dispatch(
					operationChanged({
						packageName,
						operation: { kind: 'remove', status: 'failed', error: Squawk.coerce(error) },
					}),
				);
			}
		},
	});

	start({
		actionCreator: updateExtension,
		effect: async ({ payload }, api) => {
			const { packageName, versionRange } = payload;

			api.dispatch(
				operationChanged({
					packageName,
					operation: { kind: 'update', status: 'pending', version: versionRange },
				}),
			);

			try {
				const extension = await ipcExtensionsService.update({ packageName, versionRange });
				VariableManager.registerExtension(extension);
				api.dispatch(extensionUpsert({ extension }));
				api.dispatch(operationChanged({ packageName, operation: null }));
			} catch (error) {
				api.dispatch(
					operationChanged({
						packageName,
						operation: { kind: 'update', status: 'failed', error: Squawk.coerce(error) },
					}),
				);
			}
		},
	});

	start({
		actionCreator: checkExtensionUpdates,
		effect: async (_action, api) => {
			try {
				const updates = await ipcExtensionsService.checkUpdates();
				api.dispatch(updatesAvailable({ updates }));
			} catch {
				// Surface failures as an empty result rather than a permanent error.
				api.dispatch(updatesAvailable({ updates: [] }));
			}
		},
	});

	let lastSearchToken = 0;
	start({
		actionCreator: searchExtensions,
		effect: async ({ payload }, api) => {
			const token = ++lastSearchToken;
			api.dispatch(searchStateChanged({ query: payload.query, loading: true }));

			if (!payload.query.trim()) {
				api.dispatch(searchStateChanged({ results: [], loading: false }));
				return;
			}

			try {
				const results = await ipcExtensionsService.search({ query: payload.query });
				if (token !== lastSearchToken) return;
				api.dispatch(searchStateChanged({ results, loading: false }));
			} catch {
				if (token !== lastSearchToken) return;
				api.dispatch(searchStateChanged({ results: [], loading: false }));
			}
		},
	});
}

async function loadAll(api: { dispatch: (a: { type: string; [k: string]: unknown }) => unknown }) {
	const extensions = await ipcExtensionsService.list();

	api.dispatch(alertRemoveType('invalid_extension'));
	api.dispatch(extensionsLoaded({ extensions }));

	for (const extension of extensions) {
		if (extension.status === 'loaded') {
			VariableManager.registerExtension(extension);
			continue;
		}

		api.dispatch(
			alertInsert({
				ident: ksuid.generate('alert').toString(),
				alert: {
					type: 'invalid_extension',
					severity: 'error',
					scope: { kind: 'project' },
					payload: {
						error: extension.error,
						assumedName: extension.packageName,
						filePath: extension.filePath,
					},
				},
			}),
		);
	}
}
