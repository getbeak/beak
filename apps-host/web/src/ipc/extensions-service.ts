import { IpcExtensionsServiceMain } from '@beak/common/ipc/extensions';
import type { Extension, ExtensionSearchResult } from '@beak/common/types/extensions';
import Squawk from '@beak/common/utils/squawk';
import { ExtensionRegistry } from '@beak/runtime-shared/extensions';

import getRuntime from '../host';
import WebExtensionManager, { getExtensionsDir } from '../lib/extension/manager';
import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

const service = new IpcExtensionsServiceMain(webIpcMain);
const manager = new WebExtensionManager(service);
const registry = new ExtensionRegistry(getRuntime().providers);

function projectContext(): { projectId: string; projectFolderPath: string; extensionsDir: string } {
	const projectFolderPath = getCurrentProjectFolder();
	if (!projectFolderPath) throw new Squawk('no_project_loaded', {});
	const projectId = currentProjectId();
	if (!projectId) throw new Squawk('no_project_loaded', {});
	return {
		projectId,
		projectFolderPath,
		extensionsDir: getExtensionsDir(projectFolderPath),
	};
}

function currentProjectId(): string | null {
	// The web host is single-project, so the manager's per-project map only
	// ever has one bucket — pin to a synthetic id. If web ever grows real
	// multi-project support, replace this with the active project's id and
	// re-validate every call site that keys on it.
	return 'web';
}

/* -------------------------------------------------------------------------- */
/*  Management                                                                */
/* -------------------------------------------------------------------------- */

service.registerList(async () => {
	const { projectId, extensionsDir } = projectContext();
	const installed = await getRuntime().projectExtensions.listInstalled(extensionsDir);

	await manager.resetProject(projectId);

	const results: Extension[] = [];
	for (const entry of installed) {
		try {
			results.push(await manager.load(projectId, entry.absolutePath));
		} catch (error) {
			results.push({
				status: 'failed',
				packageName: entry.packageName,
				filePath: entry.absolutePath,
				error: Squawk.coerce(error),
			});
		}
	}

	return results;
});

service.registerInstall(async (_event, payload) => {
	const { projectId, extensionsDir } = projectContext();

	await getRuntime().projectExtensions.ensureScaffold(extensionsDir);

	const resolved = await registry.resolveVersion(payload.packageName, payload.versionRange);
	const destination = await registry.install(resolved, extensionsDir);

	await getRuntime().projectExtensions.addDependency(extensionsDir, resolved.packageName, resolved.version);

	return await manager.load(projectId, destination);
});

service.registerRemove(async (_event, payload) => {
	const { projectId, extensionsDir } = projectContext();

	await manager.unload(projectId, payload.packageName);
	await registry.remove(payload.packageName, extensionsDir);
	await getRuntime().projectExtensions.removeDependency(extensionsDir, payload.packageName);
});

service.registerUpdate(async (_event, payload) => {
	const { projectId, extensionsDir } = projectContext();

	await getRuntime().projectExtensions.ensureScaffold(extensionsDir);
	await manager.unload(projectId, payload.packageName);

	const resolved = await registry.resolveVersion(payload.packageName, payload.versionRange ?? 'latest');
	const destination = await registry.install(resolved, extensionsDir);

	await getRuntime().projectExtensions.addDependency(extensionsDir, resolved.packageName, resolved.version);

	return await manager.load(projectId, destination);
});

service.registerCheckUpdates(async () => {
	const { extensionsDir } = projectContext();
	const installed = await getRuntime().projectExtensions.listInstalled(extensionsDir);

	const results = await Promise.all(
		installed.map(async entry => {
			try {
				return await registry.checkUpdate(entry.packageName, entry.version);
			} catch {
				return null;
			}
		}),
	);

	return results.filter((u): u is NonNullable<typeof u> => u !== null);
});

service.registerSearch(async (_event, payload) => {
	const hits = await registry.search(payload.query, payload.limit);

	return hits.map<ExtensionSearchResult>(hit => ({
		packageName: hit.package.name,
		description: hit.package.description,
		version: hit.package.version,
		author: hit.package.author?.name,
		homepage: hit.package.links?.homepage ?? hit.package.links?.repository,
		publishedAt: hit.package.date,
	}));
});

/* -------------------------------------------------------------------------- */
/*  Variable runtime                                                          */
/* -------------------------------------------------------------------------- */

service.registerVariableCreateDefaultPayload(async (_event, payload) => {
	const { projectId } = projectContext();
	return await manager.variableCreateDefaultPayload(projectId, payload.type, payload.context);
});

service.registerVariableGetValue(async (_event, payload) => {
	const { projectId } = projectContext();
	return await manager.variableGetValue(
		projectId,
		payload.type,
		payload.context,
		payload.payload,
		payload.recursiveDepth,
	);
});

service.registerVariableGetAssetRef(async (_event, payload) => {
	const { projectId } = projectContext();
	return await manager.variableGetAssetRef(
		projectId,
		payload.type,
		payload.context,
		payload.payload,
		payload.recursiveDepth,
	);
});

service.registerVariableEditorCreateUI(async (_event, payload) => {
	const { projectId } = projectContext();
	return await manager.variableEditorCreateUI(projectId, payload.type, payload.context);
});

service.registerVariableEditorLoad(async (_event, payload) => {
	const { projectId } = projectContext();
	return await manager.variableEditorLoad(projectId, payload.type, payload.context, payload.payload);
});

service.registerVariableEditorSave(async (_event, payload) => {
	const { projectId } = projectContext();
	return await manager.variableEditorSave(
		projectId,
		payload.type,
		payload.context,
		payload.existingPayload,
		payload.state,
	);
});
