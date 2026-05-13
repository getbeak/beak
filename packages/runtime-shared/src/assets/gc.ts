import type { Providers } from '../base';
import { BeakBase } from '../base';

/** Anything that looks like an `AssetRef` — extracted recursively. */
interface AssetRefShape {
	sha256: string;
}

const SHA256_HEX = /^[0-9a-f]{64}$/;
const ASSETS_DIRNAME = '_assets';

/**
 * Garbage-collect unreferenced binary assets. The store is content-addressed
 * by sha256; an asset is "reachable" if its sha256 appears inside any JSON
 * file under `tree/`. Anything else is collected on demand by a user.
 *
 * This class never deletes implicitly — `findOrphans` is read-only and
 * `delete` requires the caller to pass the result. That keeps a future
 * `beak gc` command auditable: list, confirm, delete.
 */
export default class AssetGc extends BeakBase {
	constructor(providers: Providers) {
		super(providers);
	}

	/**
	 * Walk the project's `tree/` and gather every `sha256` that appears
	 * anywhere inside an `AssetRef`-shaped object (`{ sha256: '<hex>', … }`).
	 * Non-hex strings and non-asset shapes are ignored.
	 */
	async findReferencedShas(projectRoot: string): Promise<Set<string>> {
		const referenced = new Set<string>();
		const treeRoot = this.p.node.path.join(projectRoot, 'tree');
		if (!(await this.exists(treeRoot))) return referenced;
		await this.walkJsonRecursive(treeRoot, async value => {
			collectShas(value, referenced);
		});
		return referenced;
	}

	/**
	 * List every sha256 that has bytes on disk under `_assets/`. Pairs with
	 * `findReferencedShas` to compute orphans.
	 */
	async findStoredShas(projectRoot: string): Promise<Set<string>> {
		const stored = new Set<string>();
		const assetsRoot = this.p.node.path.join(projectRoot, ASSETS_DIRNAME);
		if (!(await this.exists(assetsRoot))) return stored;

		const shards = await this.readdir(assetsRoot);
		for (const shard of shards) {
			if (!/^[0-9a-f]{2}$/.test(shard)) continue;
			const shardPath = this.p.node.path.join(assetsRoot, shard);
			const entries = await this.readdir(shardPath);
			for (const e of entries) {
				if (SHA256_HEX.test(e)) stored.add(e);
			}
		}
		return stored;
	}

	/**
	 * Stored shas that nothing under `tree/` references. The caller decides
	 * whether to delete them — this method does not mutate.
	 */
	async findOrphans(projectRoot: string): Promise<string[]> {
		const [referenced, stored] = await Promise.all([
			this.findReferencedShas(projectRoot),
			this.findStoredShas(projectRoot),
		]);
		const out: string[] = [];
		for (const sha of stored) if (!referenced.has(sha)) out.push(sha);
		return out;
	}

	/**
	 * Delete a list of shas (the typical input being `findOrphans`'s result).
	 * Returns the shas that were actually removed — a missing asset is
	 * silently skipped.
	 */
	async delete(projectRoot: string, shas: string[]): Promise<string[]> {
		const removed: string[] = [];
		for (const sha of shas) {
			if (!SHA256_HEX.test(sha)) continue;
			const filePath = this.p.node.path.join(projectRoot, ASSETS_DIRNAME, sha.slice(0, 2), sha);
			try {
				await this.p.node.fs.promises.rm(filePath, { force: true });
				removed.push(sha);
			} catch {
				/* already gone — treat as success */
			}
		}
		return removed;
	}

	private async walkJsonRecursive(
		folderPath: string,
		visit: (value: unknown) => Promise<void>,
	): Promise<void> {
		const entries = await this.readdirWithTypes(folderPath);
		for (const entry of entries) {
			const full = this.p.node.path.join(folderPath, entry.name);
			if (entry.isDirectory()) {
				await this.walkJsonRecursive(full, visit);
				continue;
			}
			if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
			try {
				const raw = await this.p.node.fs.promises.readFile(full, 'utf8');
				const parsed = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
				await visit(parsed);
			} catch {
				/* skip unreadable / unparseable files */
			}
		}
	}

	private async exists(filePath: string): Promise<boolean> {
		try {
			await this.p.node.fs.promises.stat(filePath);
			return true;
		} catch {
			return false;
		}
	}

	private async readdir(folderPath: string): Promise<string[]> {
		try {
			return (await this.p.node.fs.promises.readdir(folderPath)) as unknown as string[];
		} catch {
			return [];
		}
	}

	private async readdirWithTypes(folderPath: string): Promise<Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>> {
		try {
			// biome-ignore lint/suspicious/noExplicitAny: providers.node.fs surface is wide
			return (await this.p.node.fs.promises.readdir(folderPath, { withFileTypes: true })) as any;
		} catch {
			return [];
		}
	}
}

/**
 * Recursively scan a JSON value for `{ sha256: '<hex>', ... }` objects and
 * add their hex into `into`. Exported so callers (tests, future utilities)
 * can collect refs from in-memory values without going through the GC class.
 */
export function collectShas(value: unknown, into: Set<string>): void {
	if (value === null || typeof value !== 'object') return;
	if (Array.isArray(value)) {
		for (const v of value) collectShas(v, into);
		return;
	}
	const obj = value as Record<string, unknown>;
	if (typeof obj.sha256 === 'string' && SHA256_HEX.test(obj.sha256)) {
		into.add(obj.sha256);
	}
	for (const v of Object.values(obj)) collectShas(v, into);
}
