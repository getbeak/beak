import { collectionFileSchema } from '@beak/state/schemas';
import type { Tree } from '@getbeak/types/nodes';
import path from 'path-browserify';

import { ipcFsService } from '../../../lib/ipc';
import type { EndpointEntry, EndpointKind } from '../types';

const COLLECTION_FILENAME = '_collection.json';

/**
 * Walk the project tree and pull every folder whose `_collection.json` is
 * a source of the given kind (graphql / grpc). Read from disk each call —
 * collections change rarely, the sidebar is mounted on demand, and a stale
 * cache would hide a freshly-registered endpoint.
 */
export async function enumerateEndpoints<K extends EndpointKind>(
	kind: K,
	tree: Tree,
	projectFolderPath: string,
): Promise<EndpointEntry[]> {
	const out: EndpointEntry[] = [];

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
			if (parsed.data.source.type !== kind) continue;

			out.push({
				folderPath: folder.filePath,
				relativeFolder: toRelative(folder.filePath, projectFolderPath),
				folderName: path.basename(folder.filePath),
				collection: parsed.data,
				source: parsed.data.source as EndpointEntry['source'],
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
