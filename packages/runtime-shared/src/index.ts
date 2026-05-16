import AssetStore from './assets';
import AssetGc from './assets/gc';
import { RuntimeBase, type RuntimeCapabilities, type RuntimeOptions } from './base';
import BeakGit from './git';
import BeakProject from './project';
import OpenApiWriter from './sources/openapi-writer';
import ValueStore from './values';

export { RuntimeBase } from './base';
export type { GitProvider, Providers, RuntimeCapabilities, RuntimeOptions } from './base';
export { default as AssetStore } from './assets';
export { default as AssetGc } from './assets/gc';
export type { AssetRef } from './assets';
export {
	ExtensionRegistry,
	gunzip,
	packageDestination,
	readTar,
	verifyIntegrity,
} from './extensions';
export type {
	ExtensionRegistryOptions,
	RegistryPackageMetadata,
	RegistrySearchHit,
	RegistryVersionMetadata,
	ResolvedVersion,
	TarEntry,
} from './extensions';
export { default as BeakGit } from './git';
export { default as OpenApiWriter } from './sources/openapi-writer';
export type { OpenApiSyncInput, OpenApiSyncResult } from './sources/openapi-writer';
export { default as ValueStore } from './values';

/**
 * Top-level handle that both hosts (electron, web) instantiate. The renderer
 * receives a `Runtime` via `getRuntime()` and reads its `capabilities`
 * matrix to gate features instead of branching on `if (electron)`.
 */
export default class Runtime extends RuntimeBase {
	readonly capabilities: RuntimeCapabilities;

	private readonly beakProject: BeakProject;
	private readonly assetStore: AssetStore;
	private readonly assetGc: AssetGc;
	private readonly openApiWriter: OpenApiWriter;
	private readonly valueStore: ValueStore;
	private readonly beakGit: BeakGit;

	constructor(options: RuntimeOptions) {
		super(options.providers);

		this.capabilities = options.capabilities;
		this.beakProject = new BeakProject(this.providers, {
			defaultRecentSource: options.capabilities.fileSystemAccess === 'native' ? 'desktop' : 'browser',
		});
		this.assetStore = new AssetStore(this.providers);
		this.assetGc = new AssetGc(this.providers);
		this.openApiWriter = new OpenApiWriter(this.providers);
		this.valueStore = new ValueStore(this.providers);
		this.beakGit = new BeakGit(this.providers);
	}

	get project() {
		return this.beakProject;
	}

	/** Content-addressed asset store rooted at the open project. */
	get assets() {
		return this.assetStore;
	}

	/** Find and clean up orphaned `_assets/` blobs that nothing references. */
	get gc() {
		return this.assetGc;
	}

	/** OpenAPI-sync helpers — turn a converter result into files under tree/. */
	get openapi() {
		return this.openApiWriter;
	}

	/** Per-project request values store (`.beak/values.json`). */
	get values() {
		return this.valueStore;
	}

	/**
	 * Host-side git operations (isomorphic-git). Local-only ops work
	 * without a wired `git.http` provider; network ops throw if missing.
	 */
	get git() {
		return this.beakGit;
	}
}
