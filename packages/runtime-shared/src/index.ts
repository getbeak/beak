import { RuntimeBase, type RuntimeCapabilities, type RuntimeOptions } from './base';
import BeakProject from './project';

export { RuntimeBase } from './base';
export type { Providers, RuntimeCapabilities, RuntimeOptions } from './base';

/**
 * Top-level handle that both hosts (electron, web) instantiate. The renderer
 * receives a `Runtime` via `getRuntime()` and reads its `capabilities`
 * matrix to gate features instead of branching on `if (electron)`.
 */
export default class Runtime extends RuntimeBase {
	readonly capabilities: RuntimeCapabilities;

	private readonly beakProject: BeakProject;

	constructor(options: RuntimeOptions) {
		super(options.providers);

		this.capabilities = options.capabilities;
		this.beakProject = new BeakProject(this.providers);
	}

	get project() {
		return this.beakProject;
	}
}
