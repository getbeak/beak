import type { CollectionFile, CollectionSource } from '@beak/state/schemas';
import { collectionFileSchema } from '@beak/state/schemas';
import type { Tree } from '@getbeak/types/nodes';
import path from 'path-browserify';

import { ipcFsService } from '../../../lib/ipc';

const COLLECTION_FILENAME = '_collection.json';

export interface OpenApiSourceEntry {
	/** Absolute folder path on disk. */
	folderPath: string;
	/** Project-relative folder path (e.g. `tree/users`). */
	relativeFolder: string;
	collection: CollectionFile;
	source: Extract<CollectionSource, { type: 'openapi' }>;
}

/**
 * Walk the project tree and pull every folder whose `_collection.json` is
 * an openapi source. We intentionally re-read the file from disk rather
 * than caching — collections change rarely, the home page is opened on
 * demand, and a stale cache would hide a freshly-imported sync source.
 */
export async function enumerateOpenApiSources(tree: Tree, projectFolderPath: string): Promise<OpenApiSourceEntry[]> {
	const out: OpenApiSourceEntry[] = [];

	const folders = Object.values(tree).filter(n => n.type === 'folder');
	for (const folder of folders) {
		const collectionPath = path.join(folder.filePath, COLLECTION_FILENAME);
		// pathExists is cheap and lets us skip the JSON read for the
		// (much more common) folder-without-a-collection case.
		// eslint-disable-next-line no-await-in-loop
		if (!(await ipcFsService.pathExists(collectionPath))) continue;

		try {
			// eslint-disable-next-line no-await-in-loop
			const raw = await ipcFsService.readJson<unknown>(collectionPath);
			const parsed = collectionFileSchema.safeParse(raw);
			if (!parsed.success) continue;
			if (parsed.data.source.type !== 'openapi') continue;

			out.push({
				folderPath: folder.filePath,
				relativeFolder: toRelative(folder.filePath, projectFolderPath),
				collection: parsed.data,
				source: parsed.data.source,
			});
		} catch {
			// Malformed collections shouldn't break the home page; skip them.
		}
	}

	out.sort((a, b) => a.relativeFolder.localeCompare(b.relativeFolder));
	return out;
}

function toRelative(folderPath: string, projectFolderPath: string): string {
	if (!projectFolderPath) return folderPath;
	const root = projectFolderPath.replace(/\/+$/, '');
	if (folderPath === root) return '.';
	if (folderPath.startsWith(`${root}/`)) return folderPath.slice(root.length + 1);
	return folderPath;
}
