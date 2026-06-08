import path from 'node:path';

import { IpcExtensionsServiceMain } from '@beak/common/ipc/extensions';
import type { Extension, ExtensionSearchResult } from '@beak/common/types/extensions';
import Squawk from '@beak/common/utils/squawk';
import { ExtensionRegistry, packageDestination } from '@beak/runtime-shared/extensions';
import type { ExtensionSender } from '@beak/runtime-shared/ports/extension-runtime';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

import getBeakHost from '../host';
import ExtensionManager, { getExtensionsDir } from '../lib/extension';
import { ensureWithinProject } from './fs-service';
import { getProjectFolder } from './utils';

function makeSender(event: IpcMainInvokeEvent): ExtensionSender {
	return { send: (channel, payload) => event.sender.send(channel, payload) };
}

const service = new IpcExtensionsServiceMain(ipcMain);
const extensionManager = new ExtensionManager(service);
const registry = new ExtensionRegistry(getBeakHost().providers);

async function getProjectId(event: IpcMainInvokeEvent) {
	const projectFolderPath = getProjectFolder(event);
	const projectFile = await getBeakHost().project.readProjectFile(projectFolderPath);
	if (!projectFile?.id) throw new Squawk('invalid_project_file', { projectFile });
	return { projectId: projectFile.id, projectFolderPath };
}

/* -------------------------------------------------------------------------- */
/*  Management                                                                */
/* -------------------------------------------------------------------------- */

service.registerList(async event => {
	const { projectId, projectFolderPath } = await getProjectId(event as IpcMainInvokeEvent);
	const extensionsDir = getExtensionsDir(projectFolderPath);
	const installed = await getBeakHost().projectExtensions.listInstalled(extensionsDir);

	// Reset the project's isolates so the renderer-driven re-load gets a clean slate.
	await extensionManager.resetProject(projectId);

	const results: Extension[] = [];

	for (const entry of installed) {
		try {
			const loaded = await extensionManager.load(projectFolderPath, projectId, entry.absolutePath);
			results.push(loaded);
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

service.registerInstall(async (event, payload) => {
	const invokeEvent = event as IpcMainInvokeEvent;
	const { projectId, projectFolderPath } = await getProjectId(invokeEvent);
	const extensionsDir = getExtensionsDir(projectFolderPath);

	await getBeakHost().projectExtensions.ensureScaffold(extensionsDir);

	const resolved = await registry.resolveVersion(payload.packageName, payload.versionRange);
	const destination = await registry.install(resolved, extensionsDir);

	await ensureWithinProject(projectFolderPath, destination);
	await getBeakHost().projectExtensions.addDependency(extensionsDir, resolved.packageName, resolved.version);

	const loaded = await extensionManager.load(projectFolderPath, projectId, destination);
	return loaded;
});

service.registerRemove(async (event, payload) => {
	const invokeEvent = event as IpcMainInvokeEvent;
	const { projectId, projectFolderPath } = await getProjectId(invokeEvent);
	const extensionsDir = getExtensionsDir(projectFolderPath);

	const destination = packageDestination(path, extensionsDir, payload.packageName);
	await ensureWithinProject(projectFolderPath, destination);

	await extensionManager.unload(projectId, payload.packageName);
	await registry.remove(payload.packageName, extensionsDir);
	await getBeakHost().projectExtensions.removeDependency(extensionsDir, payload.packageName);
});

service.registerUpdate(async (event, payload) => {
	const invokeEvent = event as IpcMainInvokeEvent;
	const { projectId, projectFolderPath } = await getProjectId(invokeEvent);
	const extensionsDir = getExtensionsDir(projectFolderPath);

	await getBeakHost().projectExtensions.ensureScaffold(extensionsDir);
	await extensionManager.unload(projectId, payload.packageName);

	const resolved = await registry.resolveVersion(payload.packageName, payload.versionRange ?? 'latest');
	const destination = await registry.install(resolved, extensionsDir);

	await ensureWithinProject(projectFolderPath, destination);
	await getBeakHost().projectExtensions.addDependency(extensionsDir, resolved.packageName, resolved.version);

	const loaded = await extensionManager.load(projectFolderPath, projectId, destination);
	return loaded;
});

service.registerCheckUpdates(async event => {
	const { projectFolderPath } = await getProjectId(event as IpcMainInvokeEvent);
	const extensionsDir = getExtensionsDir(projectFolderPath);
	const installed = await getBeakHost().projectExtensions.listInstalled(extensionsDir);

	const results = await Promise.all(
		installed.map(async entry => {
			try {
				return await registry.checkUpdate(entry.packageName, entry.version);
			} catch {
				// Network failures shouldn't poison the whole batch.
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

service.registerVariableCreateDefaultPayload(async (event, payload) => {
	const { projectId } = await getProjectId(event as IpcMainInvokeEvent);
	return await extensionManager.variableCreateDefaultPayload(projectId, payload.type, payload.context);
});

service.registerVariableGetValue(async (event, payload) => {
	const invokeEvent = event as IpcMainInvokeEvent;
	const { projectId } = await getProjectId(invokeEvent);
	return await extensionManager.variableGetValue(
		projectId,
		payload.type,
		payload.context,
		makeSender(invokeEvent),
		payload.payload,
		payload.recursiveDepth,
	);
});

service.registerVariableGetAssetRef(async (event, payload) => {
	const invokeEvent = event as IpcMainInvokeEvent;
	const { projectId } = await getProjectId(invokeEvent);
	return await extensionManager.variableGetAssetRef(
		projectId,
		payload.type,
		payload.context,
		makeSender(invokeEvent),
		payload.payload,
		payload.recursiveDepth,
	);
});

service.registerVariableEditorCreateUI(async (event, payload) => {
	const { projectId } = await getProjectId(event as IpcMainInvokeEvent);
	return await extensionManager.variableEditorCreateUI(projectId, payload.type, payload.context);
});

service.registerVariableEditorLoad(async (event, payload) => {
	const { projectId } = await getProjectId(event as IpcMainInvokeEvent);
	return await extensionManager.variableEditorLoad(projectId, payload.type, payload.context, payload.payload);
});

service.registerVariableEditorSave(async (event, payload) => {
	const { projectId } = await getProjectId(event as IpcMainInvokeEvent);
	return await extensionManager.variableEditorSave(
		projectId,
		payload.type,
		payload.context,
		payload.existingPayload,
		payload.state,
	);
});
