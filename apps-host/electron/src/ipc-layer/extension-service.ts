import path from 'node:path';

import { IpcExtensionsServiceMain } from '@beak/common/ipc/extensions';
import type { Extension, ExtensionSearchResult } from '@beak/common/types/extensions';
import Squawk from '@beak/common/utils/squawk';
import { ExtensionRegistry, packageDestination } from '@beak/runtime-shared/extensions';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';
import fs from 'fs-extra';

import getBeakHost from '../host';
import ExtensionManager, { getExtensionsDir } from '../lib/extension';
import { ensureWithinProject } from './fs-service';
import { getProjectFilePathWindowMapping } from './fs-shared';
import { getProjectFolder } from './utils';

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
	const installed = await listInstalledOnDisk(extensionsDir);

	// Reset the project's isolates so the renderer-driven re-load gets a clean slate.
	await extensionManager.resetProject(projectId);

	const results: Extension[] = [];

	for (const entry of installed) {
		try {
			const loaded = await extensionManager.load(event, projectId, entry.absolutePath);
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

	await ensureExtensionsScaffold(extensionsDir);

	const resolved = await registry.resolveVersion(payload.packageName, payload.versionRange);
	const destination = await registry.install(resolved, extensionsDir);

	await ensureWithinProject(getProjectFilePathWindowMapping(invokeEvent), destination);
	await updateManifestEntry(extensionsDir, resolved.packageName, resolved.version);

	const loaded = await extensionManager.load(invokeEvent, projectId, destination);
	return loaded;
});

service.registerRemove(async (event, payload) => {
	const invokeEvent = event as IpcMainInvokeEvent;
	const { projectId, projectFolderPath } = await getProjectId(invokeEvent);
	const extensionsDir = getExtensionsDir(projectFolderPath);

	const destination = packageDestination(path, extensionsDir, payload.packageName);
	await ensureWithinProject(getProjectFilePathWindowMapping(invokeEvent), destination);

	await extensionManager.unload(projectId, payload.packageName);
	await registry.remove(payload.packageName, extensionsDir);
	await removeManifestEntry(extensionsDir, payload.packageName);
});

service.registerUpdate(async (event, payload) => {
	const invokeEvent = event as IpcMainInvokeEvent;
	const { projectId, projectFolderPath } = await getProjectId(invokeEvent);
	const extensionsDir = getExtensionsDir(projectFolderPath);

	await ensureExtensionsScaffold(extensionsDir);
	await extensionManager.unload(projectId, payload.packageName);

	const resolved = await registry.resolveVersion(payload.packageName, payload.versionRange ?? 'latest');
	const destination = await registry.install(resolved, extensionsDir);

	await ensureWithinProject(getProjectFilePathWindowMapping(invokeEvent), destination);
	await updateManifestEntry(extensionsDir, resolved.packageName, resolved.version);

	const loaded = await extensionManager.load(invokeEvent, projectId, destination);
	return loaded;
});

service.registerCheckUpdates(async event => {
	const { projectFolderPath } = await getProjectId(event as IpcMainInvokeEvent);
	const extensionsDir = getExtensionsDir(projectFolderPath);
	const installed = await listInstalledOnDisk(extensionsDir);

	const results = await Promise.all(installed.map(async entry => {
		try {
			return await registry.checkUpdate(entry.packageName, entry.version);
		} catch {
			// Network failures shouldn't poison the whole batch.
			return null;
		}
	}));

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
		invokeEvent.sender,
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
		invokeEvent.sender,
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

/* -------------------------------------------------------------------------- */
/*  On-disk helpers                                                           */
/* -------------------------------------------------------------------------- */

interface InstalledEntry {
	packageName: string;
	absolutePath: string;
	version: string;
}

async function listInstalledOnDisk(extensionsDir: string): Promise<InstalledEntry[]> {
	const nodeModulesDir = path.join(extensionsDir, 'node_modules');
	if (!(await fs.pathExists(nodeModulesDir))) return [];

	const entries = await fs.readdir(nodeModulesDir, { withFileTypes: true });
	const results: InstalledEntry[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		if (entry.name.startsWith('.')) continue;

		if (entry.name.startsWith('@')) {
			const scopeDir = path.join(nodeModulesDir, entry.name);
			const scoped = await fs.readdir(scopeDir, { withFileTypes: true });

			for (const inner of scoped) {
				if (!inner.isDirectory()) continue;
				const abs = path.join(scopeDir, inner.name);
				const pkg = await readBeakPackageJson(abs);
				if (!pkg) continue;
				results.push({
					packageName: `${entry.name}/${inner.name}`,
					absolutePath: abs,
					version: pkg.version ?? '0.0.0',
				});
			}

			continue;
		}

		const abs = path.join(nodeModulesDir, entry.name);
		const pkg = await readBeakPackageJson(abs);
		if (!pkg) continue;

		results.push({
			packageName: entry.name,
			absolutePath: abs,
			version: pkg.version ?? '0.0.0',
		});
	}

	return results;
}

/**
 * Only return `package.json`s that are Beak extensions — anything without a
 * `beak.apiVersion` field is treated as a transitive dep that wandered in
 * via an older yarn/npm install, and quietly skipped. Without this guard
 * non-Beak packages would surface as `Failed` extensions in the UI.
 */
async function readBeakPackageJson(folder: string): Promise<{ version?: string } | null> {
	try {
		const pkg = (await fs.readJson(path.join(folder, 'package.json'))) as {
			version?: string;
			beak?: { apiVersion?: unknown };
		};
		if (!pkg.beak || typeof pkg.beak.apiVersion !== 'number') return null;
		return pkg;
	} catch {
		return null;
	}
}

async function ensureExtensionsScaffold(extensionsDir: string): Promise<void> {
	await fs.ensureDir(path.join(extensionsDir, 'node_modules'));

	const manifestPath = path.join(extensionsDir, 'package.json');
	if (!(await fs.pathExists(manifestPath))) {
		await fs.writeJson(
			manifestPath,
			{ name: 'beak-project-extensions', version: '1.0.0', private: true, dependencies: {} },
			{ spaces: 2 },
		);
	}
}

interface ProjectExtensionsManifest {
	name: string;
	version: string;
	private?: boolean;
	dependencies: Record<string, string>;
}

async function updateManifestEntry(extensionsDir: string, packageName: string, version: string): Promise<void> {
	const manifestPath = path.join(extensionsDir, 'package.json');
	const manifest = (await fs.readJson(manifestPath)) as ProjectExtensionsManifest;
	manifest.dependencies = manifest.dependencies ?? {};
	manifest.dependencies[packageName] = `^${version}`;
	await fs.writeJson(manifestPath, manifest, { spaces: 2 });
}

async function removeManifestEntry(extensionsDir: string, packageName: string): Promise<void> {
	const manifestPath = path.join(extensionsDir, 'package.json');
	if (!(await fs.pathExists(manifestPath))) return;

	const manifest = (await fs.readJson(manifestPath)) as ProjectExtensionsManifest;
	if (!manifest.dependencies) return;

	delete manifest.dependencies[packageName];
	await fs.writeJson(manifestPath, manifest, { spaces: 2 });
}

