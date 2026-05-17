import { RuntimeBase } from '../base';

/**
 * Per-project extensions folder management — disk scan + manifest read/write.
 *
 * Each Beak project ships an `extensions/` folder with a `package.json`
 * manifest and a `node_modules/` tree. Both hosts used to ship their own
 * copy of the scan + manifest-edit logic, with subtle divergences (one
 * went through `fs-extra`, the other through OPFS). The contract is
 * identical — read directories, parse a couple of JSON files — so the
 * logic lives here, behind the runtime's FS provider.
 *
 * Why this lives in `runtime-shared` rather than `@beak/state`: it
 * touches the filesystem, and the FS abstraction differs across hosts.
 * `runtime-shared` is the cross-host helper layer; `@beak/state` is
 * supposed to stay IO-free.
 */

export interface InstalledExtensionEntry {
	packageName: string;
	absolutePath: string;
	version: string;
}

export interface ProjectExtensionsManifest {
	name: string;
	version: string;
	private?: boolean;
	dependencies: Record<string, string>;
}

function defaultManifest(): ProjectExtensionsManifest {
	return {
		name: 'beak-project-extensions',
		version: '1.0.0',
		private: true,
		dependencies: {},
	};
}

/**
 * Read `package.json` and only return it when it's a Beak extension —
 * specifically, when `beak.apiVersion` is a number. This filters out
 * transitive deps that wandered into `node_modules/` via an older
 * yarn/npm install; without the guard they'd surface as `Failed`
 * extensions in the UI.
 */
async function readBeakPackageJsonRaw(
	fs: { readFile: (p: string, enc?: string) => Promise<unknown> },
	path: { join: (...parts: string[]) => string },
	folder: string,
): Promise<{ version?: string } | null> {
	try {
		const raw = await fs.readFile(path.join(folder, 'package.json'), 'utf8');
		const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw as Uint8Array);
		const pkg = JSON.parse(text) as { version?: string; beak?: { apiVersion?: unknown } };
		if (!pkg.beak || typeof pkg.beak.apiVersion !== 'number') return null;
		return pkg;
	} catch {
		return null;
	}
}

export class ProjectExtensions extends RuntimeBase {
	/**
	 * Enumerate every Beak extension installed in `<extensionsDir>/node_modules/`.
	 * Handles both flat (`pkgname/`) and scoped (`@scope/pkgname/`) layouts;
	 * non-Beak dirs are quietly skipped. Returns `[]` when the directory
	 * doesn't exist — typical for a freshly-created project.
	 */
	async listInstalled(extensionsDir: string): Promise<InstalledExtensionEntry[]> {
		const fs = this.p.node.fs.promises;
		const path = this.p.node.path;
		const nodeModulesDir = path.join(extensionsDir, 'node_modules');

		const exists = await fs
			.stat(nodeModulesDir)
			.then(() => true)
			.catch(() => false);
		if (!exists) return [];

		const topLevel = await fs.readdir(nodeModulesDir);
		const results: InstalledExtensionEntry[] = [];

		for (const name of topLevel) {
			const nameStr = typeof name === 'string' ? name : (name as { name: string }).name;
			if (typeof nameStr !== 'string') continue;
			if (nameStr.startsWith('.')) continue;

			if (nameStr.startsWith('@')) {
				const scopeDir = path.join(nodeModulesDir, nameStr);
				const scoped = await fs.readdir(scopeDir);
				for (const inner of scoped) {
					const innerStr = typeof inner === 'string' ? inner : (inner as { name: string }).name;
					if (typeof innerStr !== 'string') continue;
					const abs = path.join(scopeDir, innerStr);
					const pkg = await readBeakPackageJsonRaw(fs, path, abs);
					if (!pkg) continue;
					results.push({ packageName: `${nameStr}/${innerStr}`, absolutePath: abs, version: pkg.version ?? '0.0.0' });
				}
				continue;
			}

			const abs = path.join(nodeModulesDir, nameStr);
			const pkg = await readBeakPackageJsonRaw(fs, path, abs);
			if (!pkg) continue;
			results.push({ packageName: nameStr, absolutePath: abs, version: pkg.version ?? '0.0.0' });
		}

		return results;
	}

	/**
	 * Make sure `<extensionsDir>/node_modules/` exists and the manifest
	 * file is present with a minimal default content. Idempotent.
	 */
	async ensureScaffold(extensionsDir: string): Promise<void> {
		const fs = this.p.node.fs.promises;
		const path = this.p.node.path;
		await this.mkdirSafe(path.join(extensionsDir, 'node_modules'));

		const manifestPath = path.join(extensionsDir, 'package.json');
		const exists = await fs
			.stat(manifestPath)
			.then(() => true)
			.catch(() => false);
		if (!exists) await this.writeManifest(manifestPath, defaultManifest());
	}

	/** Read the manifest; returns `null` when missing or unparseable. */
	async readManifest(extensionsDir: string): Promise<ProjectExtensionsManifest | null> {
		const fs = this.p.node.fs.promises;
		const path = this.p.node.path;
		const manifestPath = path.join(extensionsDir, 'package.json');
		try {
			const raw = await fs.readFile(manifestPath, 'utf8');
			const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw as Uint8Array);
			return JSON.parse(text) as ProjectExtensionsManifest;
		} catch {
			return null;
		}
	}

	/** Set `dependencies[packageName]` to a caret-range of `version`. */
	async addDependency(extensionsDir: string, packageName: string, version: string): Promise<void> {
		const path = this.p.node.path;
		const manifestPath = path.join(extensionsDir, 'package.json');
		// Deep-clone the default so we never alias the module-level
		// `dependencies` object — without this, the first write to a new
		// project's manifest mutates DEFAULT_MANIFEST and bleeds into every
		// later `{ ...DEFAULT_MANIFEST }` consumer.
		const manifest = (await this.readManifest(extensionsDir)) ?? defaultManifest();
		manifest.dependencies = manifest.dependencies ?? {};
		manifest.dependencies[packageName] = `^${version}`;
		await this.writeManifest(manifestPath, manifest);
	}

	/** Remove a single dependency from the manifest. Silent no-op when absent. */
	async removeDependency(extensionsDir: string, packageName: string): Promise<void> {
		const path = this.p.node.path;
		const manifestPath = path.join(extensionsDir, 'package.json');
		const manifest = await this.readManifest(extensionsDir);
		if (!manifest?.dependencies) return;
		delete manifest.dependencies[packageName];
		await this.writeManifest(manifestPath, manifest);
	}

	private async writeManifest(manifestPath: string, manifest: ProjectExtensionsManifest): Promise<void> {
		const fs = this.p.node.fs.promises;
		const content = JSON.stringify(manifest, null, 2);
		// Both hosts have `writeFile(path, string)` available — the
		// electron `fs.writeFile` is the node one (accepts strings), the web
		// `fs.writeFile` is the OPFS adapter (accepts strings + Uint8Array).
		// Passing the string lets both backings handle their own encoding.
		await fs.writeFile(manifestPath, content);
	}

	private async mkdirSafe(p: string): Promise<void> {
		const fs = this.p.node.fs.promises;
		try {
			await fs.mkdir(p, { recursive: true });
		} catch (error) {
			if ((error as { code?: string }).code !== 'EEXIST') throw error;
		}
	}
}
