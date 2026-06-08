import type { Extension, LoadedExtension } from '@beak/common/types/extensions';

/**
 * Per-project, per-package extension record. Both hosts now use the same
 * Worker-based shape (`WorkerExtensionManager`'s `WorkerRecord`) — see
 * ADR-0003. The base only requires a `loaded` field for the management
 * IPC's `list` call — every other shape is opaque so this stays usable
 * if a third host shape ever appears.
 */
export interface RegisteredRecord {
	readonly loaded: LoadedExtension;
}

export interface RegistryOptions<TRecord> {
	/** Tear down a host-side record. Called on unload + resetProject. */
	dispose: (record: TRecord) => Promise<void> | void;
}

/**
 * Lifecycle + lookup primitives shared by both extension managers. The
 * registry owns the `Record<projectId, Record<packageName, Record>>`
 * shape; the manager (`WorkerExtensionManager`) consumes it for the
 * variable-invocation methods.
 */
export class ProjectExtensionRegistry<TRecord extends RegisteredRecord> {
	private readonly projects: Record<string, Record<string, TRecord>> = {};

	constructor(private readonly options: RegistryOptions<TRecord>) {}

	/** Drop in a freshly-loaded record, evicting any previous entry under the same name. */
	async insert(projectId: string, packageName: string, record: TRecord): Promise<void> {
		if (!this.projects[projectId]) this.projects[projectId] = {};
		const bucket = this.projects[projectId];
		const previous = bucket[packageName];
		if (previous) await this.options.dispose(previous);
		bucket[packageName] = record;
	}

	/** Read every loaded extension's surface for the management IPC's `list` call. */
	list(projectId: string): Extension[] {
		const bucket = this.projects[projectId];
		if (!bucket) return [];
		return Object.values(bucket).map(r => r.loaded);
	}

	/** Look up the record for a (projectId, packageName) pair. `null` when absent. */
	byPackage(projectId: string, packageName: string): TRecord | null {
		return this.projects[projectId]?.[packageName] ?? null;
	}

	/** Dispose a single package's record and remove it from the bucket. */
	async unload(projectId: string, packageName: string): Promise<void> {
		const record = this.projects[projectId]?.[packageName];
		if (!record) return;
		await this.options.dispose(record);
		delete this.projects[projectId][packageName];
	}

	/** Dispose every record for a project and clear its bucket. */
	async resetProject(projectId: string): Promise<void> {
		const bucket = this.projects[projectId];
		if (!bucket) return;
		for (const record of Object.values(bucket)) {
			await this.options.dispose(record);
		}
		this.projects[projectId] = {};
	}
}
