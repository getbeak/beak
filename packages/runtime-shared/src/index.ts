import AssetStore from './assets';
import AssetGc from './assets/gc';
import { RuntimeBase, type RuntimeCapabilities, type RuntimeOptions } from './base';
import { ProjectExtensions } from './extensions/project-extensions';
import { FsSandbox } from './fs-sandbox';
import BeakGit from './git';
import BeakProject from './project';
import ProjectSecrets from './secrets/project-secrets';
import OpenApiWriter from './sources/openapi-writer';
import ValueStore from './values';

export type { AssetRef } from './assets';
export { default as AssetStore } from './assets';
export { default as AssetGc } from './assets/gc';
export type { GitProvider, Providers, RuntimeCapabilities, RuntimeOptions } from './base';
export { RuntimeBase } from './base';
export type {
	ConfirmOptions,
	MessageBoxType,
	OpenDialogProperty,
	ShowMessageBoxOptions,
	ShowMessageBoxResult,
	ShowOpenDialogOptions,
	ShowOpenDialogResult,
} from './ports/dialog';
export type { default as Dialog } from './ports/dialog';
export type { ExtensionSender } from './ports/extension-runtime';
export { default as ExtensionRuntime } from './ports/extension-runtime';
export { default as NotificationPort } from './ports/notification';
export { default as ProjectOpener } from './ports/project-opener';
export type {
	ExtensionRegistryOptions,
	RegistryPackageMetadata,
	RegistrySearchHit,
	RegistryVersionMetadata,
	ResolvedVersion,
	TarEntry,
} from './extensions';
export {
	ExtensionRegistry,
	gunzip,
	packageDestination,
	readTar,
	verifyIntegrity,
} from './extensions';
export { default as BeakGit } from './git';
export { type GitBindingsOptions, registerGitBindings } from './git/bindings';
export { type FetchTextDeps, fetchText, makeCappedBodyReader, parseHttpUrl } from './http/fetch-text';
export type { PreferencesChangeEvent } from './ports/preferences-store';
export { default as PreferencesStore } from './ports/preferences-store';
export { default as ProjectSecrets } from './secrets/project-secrets';
export type { OpenApiReadResult, OpenApiSyncInput, OpenApiSyncResult } from './sources/openapi-writer';
export { default as OpenApiWriter } from './sources/openapi-writer';
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
	private readonly projectExt: ProjectExtensions;
	private readonly fsSandbox: FsSandbox;
	private readonly projectSecrets: ProjectSecrets;

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
		this.projectExt = new ProjectExtensions(this.providers);
		this.fsSandbox = new FsSandbox(this.providers, this.beakProject);
		this.projectSecrets = new ProjectSecrets(this.providers.aes, this.providers.credentials, options.writeToClipboard);
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

	/**
	 * Per-project extensions folder management — `node_modules/` scan +
	 * `package.json` manifest read/write. Used by both hosts' extension
	 * service handlers; previously each maintained its own copy.
	 */
	get projectExtensions() {
		return this.projectExt;
	}

	/**
	 * Filesystem sandbox helper — every IPC handler that takes a path
	 * runs through `runtime.fs.ensureWithinProject(...)` so a malicious
	 * renderer can't reach outside the open project root.
	 */
	get fs() {
		return this.fsSandbox;
	}

	/**
	 * Per-project encryption surface. IPC handlers delegate all key-management
	 * and crypto work here instead of reaching into providers directly.
	 */
	get secrets() {
		return this.projectSecrets;
	}

	/**
	 * Host-specific project-opener port — shows a folder picker and
	 * validates/opens a project folder. Both shells supply their own
	 * adapter; see ADR 0006 §3.
	 */
	get projectOpener() {
		return this.providers.projectOpener;
	}
}
