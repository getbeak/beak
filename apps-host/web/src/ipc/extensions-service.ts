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
	const installed = await listInstalledOnDisk(extensionsDir);

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

	await ensureExtensionsScaffold(extensionsDir);

	const resolved = await registry.resolveVersion(payload.packageName, payload.versionRange);
	const destination = await registry.install(resolved, extensionsDir);

	await updateManifestEntry(extensionsDir, resolved.packageName, resolved.version);

	return await manager.load(projectId, destination);
});

service.registerRemove(async (_event, payload) => {
	const { projectId, extensionsDir } = projectContext();

	await manager.unload(projectId, payload.packageName);
	await registry.remove(payload.packageName, extensionsDir);
	await removeManifestEntry(extensionsDir, payload.packageName);
});

service.registerUpdate(async (_event, payload) => {
	const { projectId, extensionsDir } = projectContext();

	await ensureExtensionsScaffold(extensionsDir);
	await manager.unload(projectId, payload.packageName);

	const resolved = await registry.resolveVersion(payload.packageName, payload.versionRange ?? 'latest');
	const destination = await registry.install(resolved, extensionsDir);

	await updateManifestEntry(extensionsDir, resolved.packageName, resolved.version);

	return await manager.load(projectId, destination);
});

service.registerCheckUpdates(async () => {
	const { extensionsDir } = projectContext();
	const installed = await listInstalledOnDisk(extensionsDir);

	const results = await Promise.all(installed.map(async entry => {
		try {
			return await registry.checkUpdate(entry.packageName, entry.version);
		} catch {
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

service.registerVariableCreateDefaultPayload(async (_event, payload) => {
	const { projectId } = projectContext();
	return await manager.variableCreateDefaultPayload(projectId, payload.type, payload.context);
});

service.registerVariableGetValue(async (_event, payload) => {
	const { projectId } = projectContext();
	return await manager.variableGetValue(projectId, payload.type, payload.context, payload.payload, payload.recursiveDepth);
});

service.registerVariableGetAssetRef(async (_event, payload) => {
	const { projectId } = projectContext();
	return await manager.variableGetAssetRef(projectId, payload.type, payload.context, payload.payload, payload.recursiveDepth);
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
	return await manager.variableEditorSave(projectId, payload.type, payload.context, payload.existingPayload, payload.state);
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
	const fs = getRuntime().p.node.fs.promises;
	const path = getRuntime().p.node.path;
	const nodeModulesDir = path.join(extensionsDir, 'node_modules');

	const exists = await fs.stat(nodeModulesDir).then(() => true).catch(() => false);
	if (!exists) return [];

	const topLevel = await fs.readdir(nodeModulesDir);
	const results: InstalledEntry[] = [];

	for (const name of topLevel) {
		if (typeof name !== 'string') continue;
		if (name.startsWith('.')) continue;

		if (name.startsWith('@')) {
			const scopeDir = path.join(nodeModulesDir, name);
			const scoped = await fs.readdir(scopeDir);
			for (const inner of scoped) {
				if (typeof inner !== 'string') continue;
				const abs = path.join(scopeDir, inner);
				const pkg = await readBeakPackageJson(abs);
				if (!pkg) continue;
				results.push({ packageName: `${name}/${inner}`, absolutePath: abs, version: pkg.version ?? '0.0.0' });
			}
			continue;
		}

		const abs = path.join(nodeModulesDir, name);
		const pkg = await readBeakPackageJson(abs);
		if (!pkg) continue;
		results.push({ packageName: name, absolutePath: abs, version: pkg.version ?? '0.0.0' });
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
		const fs = getRuntime().p.node.fs.promises;
		const path = getRuntime().p.node.path;
		const raw = await fs.readFile(path.join(folder, 'package.json'), 'utf8');
		const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw as Uint8Array);
		const pkg = JSON.parse(text) as { version?: string; beak?: { apiVersion?: unknown } };
		if (!pkg.beak || typeof pkg.beak.apiVersion !== 'number') return null;
		return pkg;
	} catch {
		return null;
	}
}

async function ensureExtensionsScaffold(extensionsDir: string): Promise<void> {
	const fs = getRuntime().p.node.fs.promises;
	const path = getRuntime().p.node.path;
	await mkdirSafe(fs, path.join(extensionsDir, 'node_modules'));

	const manifestPath = path.join(extensionsDir, 'package.json');
	const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
	if (!exists) {
		const content = JSON.stringify(
			{ name: 'beak-project-extensions', version: '1.0.0', private: true, dependencies: {} },
			null,
			2,
		);
		await fs.writeFile(manifestPath, new TextEncoder().encode(content));
	}
}

async function mkdirSafe(
	fs: { mkdir(p: string, opts?: { recursive?: boolean }): Promise<string | undefined | void> },
	p: string,
): Promise<void> {
	try {
		await fs.mkdir(p, { recursive: true });
	} catch (error) {
		if ((error as { code?: string }).code !== 'EEXIST') throw error;
	}
}

interface ProjectExtensionsManifest {
	name: string;
	version: string;
	private?: boolean;
	dependencies: Record<string, string>;
}

async function readManifest(manifestPath: string): Promise<ProjectExtensionsManifest | null> {
	const fs = getRuntime().p.node.fs.promises;
	try {
		const raw = await fs.readFile(manifestPath, 'utf8');
		const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw as Uint8Array);
		return JSON.parse(text) as ProjectExtensionsManifest;
	} catch {
		return null;
	}
}

async function updateManifestEntry(extensionsDir: string, packageName: string, version: string): Promise<void> {
	const path = getRuntime().p.node.path;
	const fs = getRuntime().p.node.fs.promises;
	const manifestPath = path.join(extensionsDir, 'package.json');
	const manifest = (await readManifest(manifestPath)) ?? { name: 'beak-project-extensions', version: '1.0.0', private: true, dependencies: {} };
	manifest.dependencies = manifest.dependencies ?? {};
	manifest.dependencies[packageName] = `^${version}`;
	await fs.writeFile(manifestPath, new TextEncoder().encode(JSON.stringify(manifest, null, 2)));
}

async function removeManifestEntry(extensionsDir: string, packageName: string): Promise<void> {
	const path = getRuntime().p.node.path;
	const fs = getRuntime().p.node.fs.promises;
	const manifestPath = path.join(extensionsDir, 'package.json');
	const manifest = await readManifest(manifestPath);
	if (!manifest?.dependencies) return;

	delete manifest.dependencies[packageName];
	await fs.writeFile(manifestPath, new TextEncoder().encode(JSON.stringify(manifest, null, 2)));
}

