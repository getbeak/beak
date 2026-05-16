import type { CollectionFile, CollectionSource } from '@beak/state/schemas';
import { collectionFileSchema } from '@beak/state/schemas';
import type { Tree } from '@getbeak/types/nodes';
import path from 'path-browserify';

import { ipcFsService } from '../../../lib/ipc';

const COLLECTION_FILENAME = '_collection.json';

export interface GraphqlEndpointEntry {
	/** Absolute folder path on disk. */
	folderPath: string;
	/** Project-relative folder path (e.g. `tree/api`). */
	relativeFolder: string;
	/** Folder name — used as fallback display name. */
	folderName: string;
	collection: CollectionFile;
	source: Extract<CollectionSource, { type: 'graphql' }>;
}

/**
 * Walk the project tree and pull every folder whose `_collection.json`
 * declares a graphql source. Mirrors `enumerateOpenApiSources` — read
 * from disk on each call rather than caching, since collection metadata
 * changes rarely and a stale cache would hide freshly-registered
 * endpoints.
 */
export async function enumerateGraphqlEndpoints(
	tree: Tree,
	projectFolderPath: string,
): Promise<GraphqlEndpointEntry[]> {
	const out: GraphqlEndpointEntry[] = [];

	const folders = Object.values(tree).filter(n => n.type === 'folder');
	for (const folder of folders) {
		const collectionPath = path.join(folder.filePath, COLLECTION_FILENAME);
		// eslint-disable-next-line no-await-in-loop
		if (!(await ipcFsService.pathExists(collectionPath))) continue;

		try {
			// eslint-disable-next-line no-await-in-loop
			const raw = await ipcFsService.readJson<unknown>(collectionPath);
			const parsed = collectionFileSchema.safeParse(raw);
			if (!parsed.success) continue;
			if (parsed.data.source.type !== 'graphql') continue;

			out.push({
				folderPath: folder.filePath,
				relativeFolder: toRelative(folder.filePath, projectFolderPath),
				folderName: path.basename(folder.filePath),
				collection: parsed.data,
				source: parsed.data.source,
			});
		} catch {
			// Malformed collections shouldn't break the sidebar; skip them.
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
