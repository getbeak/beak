import type { CollectionFile, RequestFileOverride } from '@beak/state/schemas';
import { mergeProposedVariableSet, type ProposedVariableSet } from '@beak/state/sources/openapi';
import type { VariableSet } from '@getbeak/types/variable-sets';

import { BeakBase } from '../base';

export interface OpenApiSyncInput {
	collection: CollectionFile;
	requests: Array<{ suggestedName: string; override: RequestFileOverride }>;
	/**
	 * Proposed Environments-style variable set. When all three of
	 * `variableSet`, `folderName`, and `projectRoot` are provided, the writer
	 * merges it into the existing on-disk variable set (or creates a fresh
	 * one), namespaces items by `folderName`, and rewrites the collection's
	 * value-part references so they point at the merged item ids. If any of
	 * them is missing the variable-set step is skipped entirely.
	 */
	variableSet?: ProposedVariableSet | null;
	/** Folder name under `tree/` for this sync. Required when `variableSet` is provided. */
	folderName?: string;
	/** Project root absolute path. Required when `variableSet` is provided. */
	projectRoot?: string;
}

export interface OpenApiSyncResult {
	collectionPath: string;
	requestPaths: string[];
	overwritten: string[];
	skipped: Array<{ path: string; reason: string }>;
	/**
	 * Files the sync deliberately left alone because they carry
	 * `_provenance.linked === false` — the user took ownership. Surfaced
	 * separately from `skipped` so the result dialog can distinguish "we
	 * couldn't write this" from "you asked us not to."
	 */
	unlinked: string[];
	/** Absolute path of the variable set written / updated, if any. */
	variableSetPath?: string;
}

/**
 * Persist the output of `openapiToCollection` into a folder under the
 * project's `tree/`. Writes `_collection.json` and one `.json` per request
 * override. Filenames come from `suggestedName`, sanitised and de-duplicated
 * against the target folder.
 *
 * On re-sync (when a file at the target path already exists):
 *  - if its `_provenance.linked === false`, the file is left untouched and
 *    reported in `unlinked` — the user has taken ownership.
 *  - otherwise the file is overwritten, but the existing `id` is preserved
 *    so any open tabs and store references stay stable across syncs.
 *
 * Operates through the runtime's `Providers.node.fs` so it works in both the
 * Electron host (native fs) and the web host (OPFS). All paths are absolute;
 * callers are responsible for joining the project root.
 */
export default class OpenApiWriter extends BeakBase {
	async syncToFolder(targetFolderPath: string, input: OpenApiSyncInput): Promise<OpenApiSyncResult> {
		const path = this.p.node.path;
		const fs = this.p.node.fs.promises;

		await fs.mkdir(targetFolderPath, { recursive: true });

		// Variable set merge happens BEFORE the collection is written so the
		// rewrite step can substitute final item ids into the collection's
		// value-parts. Gated on all three optional fields — `folderName` and
		// `projectRoot` come from the IPC layer; tests + legacy callers omit
		// them and the variable-set step is silently skipped.
		const variableSetPath =
			input.variableSet && input.projectRoot
				? path.join(input.projectRoot, 'variable-sets', `${input.variableSet.name}.json`)
				: undefined;
		let mergedVariableSet: VariableSet | null = null;
		let collectionToWrite = input.collection;
		if (input.variableSet && input.folderName && variableSetPath) {
			const existing = await this.readVariableSet(variableSetPath);
			const merge = mergeProposedVariableSet(existing, input.variableSet, input.folderName);
			mergedVariableSet = merge.merged;
			collectionToWrite = rewriteCollectionItemRefs(input.collection, input.variableSet.items, merge.itemIdByLabel);
		}

		const collectionPath = path.join(targetFolderPath, '_collection.json');
		const collectionExisted = await this.exists(collectionPath);
		await fs.writeFile(collectionPath, this.toJson(collectionToWrite), { encoding: 'utf8' });

		if (mergedVariableSet && variableSetPath) {
			await fs.mkdir(path.dirname(variableSetPath), { recursive: true });
			await fs.writeFile(variableSetPath, this.toJson(mergedVariableSet), { encoding: 'utf8' });
		}

		const result: OpenApiSyncResult = {
			collectionPath,
			requestPaths: [],
			overwritten: collectionExisted ? [collectionPath] : [],
			skipped: [],
			unlinked: [],
			...(variableSetPath && mergedVariableSet ? { variableSetPath } : {}),
		};

		// Filename uniqueness is scoped per folder — `users/list.json` and
		// `posts/list.json` don't collide. `_collection` is reserved at the
		// import-target root only; subfolders aren't currently used as
		// collection roots so the same reservation isn't necessary there.
		const usedByFolder = new Map<string, Set<string>>();
		usedByFolder.set('', new Set<string>(['_collection']));
		const ensureFolderCreated = new Set<string>();

		for (const r of input.requests) {
			const baseName = sanitiseFilename(r.suggestedName);
			if (!baseName) {
				result.skipped.push({
					path: r.suggestedName,
					reason: 'suggestedName produced an empty filename after sanitisation',
				});
				continue;
			}

			const subFolder = r.folder ?? '';
			let used = usedByFolder.get(subFolder);
			if (!used) {
				used = new Set<string>();
				usedByFolder.set(subFolder, used);
			}

			const filename = dedupe(baseName, used);
			used.add(filename);

			const subFolderAbs = subFolder ? path.join(targetFolderPath, subFolder) : targetFolderPath;
			if (subFolder && !ensureFolderCreated.has(subFolderAbs)) {
				await fs.mkdir(subFolderAbs, { recursive: true });
				ensureFolderCreated.add(subFolderAbs);
			}

			const requestPath = path.join(subFolderAbs, `${filename}.json`);
			const existing = await this.readExisting(requestPath);

			if (existing && existing.linked === false) {
				result.unlinked.push(requestPath);
				continue;
			}

			// Preserve the existing id on re-sync so open tabs + store refs stay
			// stable. The converter assigns a fresh id per call, which is correct
			// for first-time imports but would orphan every reference on re-sync.
			const override = existing?.id ? { ...r.override, id: existing.id } : r.override;

			await fs.writeFile(requestPath, this.toJson(override), { encoding: 'utf8' });

			result.requestPaths.push(requestPath);
			if (existing) result.overwritten.push(requestPath);
		}

		return result;
	}

	private toJson(value: unknown): string {
		return `${JSON.stringify(value, null, '\t')}\n`;
	}

	private async exists(filePath: string): Promise<boolean> {
		try {
			await this.p.node.fs.promises.stat(filePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Loose read for the two fields re-sync cares about: the existing `id`
	 * (to preserve identity) and `_provenance.linked` (to honour user
	 * ownership). Any parse failure or missing file returns `null`; callers
	 * treat that as "no prior file, write fresh."
	 */
	private async readExisting(filePath: string): Promise<{ id?: string; linked?: boolean } | null> {
		try {
			const raw = await this.p.node.fs.promises.readFile(filePath, 'utf8');
			const parsed = JSON.parse(raw as unknown as string) as Record<string, unknown>;
			const id = typeof parsed.id === 'string' ? parsed.id : undefined;
			const prov = parsed._provenance as { linked?: unknown } | undefined;
			const linked = typeof prov?.linked === 'boolean' ? prov.linked : undefined;
			return { id, linked };
		} catch {
			return null;
		}
	}

	/**
	 * Loose read for the on-disk variable set. Returns `null` when the file
	 * doesn't exist or fails to parse — the merger treats that as a clean
	 * slate. Schema validation isn't run here; the renderer's loader does
	 * that on next read of the project state.
	 */
	private async readVariableSet(filePath: string): Promise<VariableSet | null> {
		try {
			const raw = await this.p.node.fs.promises.readFile(filePath, 'utf8');
			return JSON.parse(raw as unknown as string) as VariableSet;
		} catch {
			return null;
		}
	}
}

/**
 * Walk the collection's `defaults` looking for value-parts that reference a
 * proposed variable-set item id, and rewrite each one to the corresponding
 * merged item id. Only `baseUrl` rides this path today; the same machinery
 * scales to header/query/cookie defaults when scheme-based imports land.
 */
function rewriteCollectionItemRefs(
	collection: CollectionFile,
	proposedItemIds: Record<string, string>,
	itemIdByLabel: Record<string, string>,
): CollectionFile {
	const proposedToFinal = new Map<string, string>();
	for (const [label, proposedId] of Object.entries(proposedItemIds)) {
		const finalId = itemIdByLabel[label];
		if (finalId !== undefined && finalId !== proposedId) proposedToFinal.set(proposedId, finalId);
	}
	if (proposedToFinal.size === 0) return collection;

	const defaults = collection.defaults;
	if (!defaults) return collection;

	const rewriteParts = (parts: unknown): unknown => {
		if (!Array.isArray(parts)) return parts;
		return parts.map(p => {
			if (
				p &&
				typeof p === 'object' &&
				(p as { type?: unknown }).type === 'variable_set_item' &&
				(p as { payload?: unknown }).payload &&
				typeof (p as { payload?: unknown }).payload === 'object'
			) {
				const payload = (p as { payload: { itemId?: unknown } }).payload;
				const itemId = typeof payload.itemId === 'string' ? payload.itemId : undefined;
				if (itemId && proposedToFinal.has(itemId)) {
					return { ...(p as object), payload: { ...payload, itemId: proposedToFinal.get(itemId) } };
				}
			}
			return p;
		});
	};

	return {
		...collection,
		defaults: {
			...defaults,
			...(defaults.baseUrl ? { baseUrl: rewriteParts(defaults.baseUrl) as typeof defaults.baseUrl } : {}),
		},
	};
}

/**
 * Make `suggestedName` safe for a filesystem filename. Strips characters that
 * commonly cause trouble on Windows/macOS/Linux (`/`, `\`, `:`, `*`, `?`,
 * `"`, `<`, `>`, `|`), collapses repeats, and trims leading/trailing dots.
 */
export function sanitiseFilename(name: string): string {
	return name
		.replace(/[\\/:*?"<>|]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^[.-]+|[.-]+$/g, '')
		.slice(0, 120);
}

function dedupe(base: string, used: Set<string>): string {
	if (!used.has(base)) return base;
	let i = 2;
	while (used.has(`${base}-${i}`)) i++;
	return `${base}-${i}`;
}
