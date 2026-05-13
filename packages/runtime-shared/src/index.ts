import AssetStore from './assets';
import { RuntimeBase, type RuntimeCapabilities, type RuntimeOptions } from './base';
import BeakProject from './project';
import OpenApiWriter from './sources/openapi-writer';

export { RuntimeBase } from './base';
export type { Providers, RuntimeCapabilities, RuntimeOptions } from './base';
export { default as AssetStore } from './assets';
export type { AssetRef } from './assets';
export { default as OpenApiWriter } from './sources/openapi-writer';
export type { OpenApiSyncInput, OpenApiSyncResult } from './sources/openapi-writer';

/**
 * Top-level handle that both hosts (electron, web) instantiate. The renderer
 * receives a `Runtime` via `getRuntime()` and reads its `capabilities`
 * matrix to gate features instead of branching on `if (electron)`.
 */
export default class Runtime extends RuntimeBase {
	readonly capabilities: RuntimeCapabilities;

	private readonly beakProject: BeakProject;
	private readonly assetStore: AssetStore;
	private readonly openApiWriter: OpenApiWriter;

	constructor(options: RuntimeOptions) {
		super(options.providers);

		this.capabilities = options.capabilities;
		this.beakProject = new BeakProject(this.providers);
		this.assetStore = new AssetStore(this.providers);
		this.openApiWriter = new OpenApiWriter(this.providers);
	}

	get project() {
		return this.beakProject;
	}

	/** Content-addressed asset store rooted at the open project. */
	get assets() {
		return this.assetStore;
	}

	/** OpenAPI-sync helpers — turn a converter result into files under tree/. */
	get openapi() {
		return this.openApiWriter;
	}
}
