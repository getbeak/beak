import Squawk from '@beak/common/utils/squawk';

import { RuntimeBase } from '../base';

const SUPPORTED_API_VERSIONS = new Set([1]);

interface PackageJsonAuthor {
	name?: string;
	email?: string;
	url?: string;
}

interface PackageJsonRepository {
	type?: string;
	url?: string;
}

interface PackageJson {
	name?: string;
	version?: string;
	description?: string;
	main?: string;
	author?: string | PackageJsonAuthor;
	homepage?: string;
	repository?: string | PackageJsonRepository;
	beak?: {
		apiVersion?: number;
		displayName?: string;
		description?: string;
	};

	/** Legacy field — present on extensions authored against the v0 API. */
	beakExtensionType?: string;
}

export interface ParsedExtensionManifest {
	packageName: string;
	version: string;
	displayName: string;
	description?: string;
	author?: string;
	homepage?: string;
	apiVersion: 1;
	scriptPath: string;
}

export interface ParseExtensionManifestOptions {
	/**
	 * Optional host-side security check called with the resolved `main`
	 * script path before it's returned. Used by the Electron host to
	 * enforce `ensureWithinProject`; the Web host omits it (the OPFS
	 * provider can't reach outside the project folder anyway).
	 */
	validateScriptPath?: (scriptPath: string) => Promise<void> | void;
}

/**
 * Read + validate an extension's `package.json`. Shared between both
 * hosts — they only differ in the optional `validateScriptPath` hook.
 */
export class ExtensionManifests extends RuntimeBase {
	async parse(extensionPath: string, options: ParseExtensionManifestOptions = {}): Promise<ParsedExtensionManifest> {
		const fs = this.p.node.fs.promises;
		const path = this.p.node.path;
		const packageJsonPath = path.join(extensionPath, 'package.json');

		let packageJson: PackageJson;
		try {
			const raw = await fs.readFile(packageJsonPath, 'utf8');
			const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw as Uint8Array);
			const parsed = JSON.parse(text) as unknown;
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
				throw new Squawk('extension_manifest_not_object', { extensionPath });
			packageJson = parsed as PackageJson;
		} catch (error) {
			if (error instanceof Squawk) throw error;
			throw new Squawk('extension_manifest_missing', { extensionPath });
		}

		if (!packageJson.name)
			throw new Squawk('invalid_extension_package', { extensionPath, key: 'name', reason: 'missing' });
		if (!packageJson.version)
			throw new Squawk('invalid_extension_package', { extensionPath, key: 'version', reason: 'missing' });
		if (typeof packageJson.main !== 'string')
			throw new Squawk('invalid_extension_package', { extensionPath, key: 'main', reason: 'missing or not a string' });

		const apiVersion = packageJson.beak?.apiVersion;
		if (apiVersion === undefined) {
			throw new Squawk('extension_missing_api_version', {
				extensionPath,
				hint: 'Add { "beak": { "apiVersion": 1 } } to package.json',
				legacyDetected: Boolean(packageJson.beakExtensionType),
			});
		}
		if (!SUPPORTED_API_VERSIONS.has(apiVersion)) {
			throw new Squawk('extension_unsupported_api_version', {
				extensionPath,
				apiVersion,
				supported: Array.from(SUPPORTED_API_VERSIONS),
			});
		}

		const scriptPath = path.join(extensionPath, packageJson.main);
		const exists = await fs
			.stat(scriptPath)
			.then(() => true)
			.catch(() => false);
		if (!exists) {
			throw new Squawk('extension_main_missing', {
				extensionPath,
				declared: packageJson.main,
				resolved: scriptPath,
			});
		}

		if (options.validateScriptPath) await options.validateScriptPath(scriptPath);

		return {
			packageName: packageJson.name,
			version: packageJson.version,
			displayName: packageJson.beak?.displayName ?? packageJson.name,
			description: packageJson.beak?.description ?? packageJson.description,
			author: formatAuthor(packageJson.author),
			homepage: packageJson.homepage ?? formatRepository(packageJson.repository),
			apiVersion: 1,
			scriptPath,
		};
	}
}

function formatAuthor(author: PackageJson['author']): string | undefined {
	if (!author) return undefined;
	if (typeof author === 'string') return author;
	return author.name ?? author.email ?? undefined;
}

function formatRepository(repository: PackageJson['repository']): string | undefined {
	if (!repository) return undefined;
	if (typeof repository === 'string') return repository;
	return repository.url?.replace(/^git\+/, '').replace(/\.git$/, '') ?? undefined;
}
