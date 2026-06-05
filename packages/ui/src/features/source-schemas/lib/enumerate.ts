import { collectionFileSchema } from '@beak/state/schemas';
import type { FolderNode } from '@getbeak/types/nodes';
import path from 'path-browserify';

import { ipcFsService } from '../../../lib/ipc';
import type { SourceSchemaEntry, SourceSchemaKind } from '../types';

const COLLECTION_FILENAME = '_collection.json';

/**
 * Walk the supplied folder list and pull every folder whose `_collection.json`
 * is a source of the given kind (graphql / grpc / openapi). Re-read from disk
 * each call — collections change rarely, the sidebar is mounted on demand,
 * and a stale cache would hide a freshly-registered endpoint.
 *
 * Takes folders rather than the full tree so callers can subscribe to a
 * shallow-stable folder slice and skip re-enumeration on every request-body
 * edit (which churns tree references without changing the folder set).
 */
export async function enumerateSourceSchemas<K extends SourceSchemaKind>(
	kind: K,
	folders: FolderNode[],
): Promise<SourceSchemaEntry[]> {
	const out: SourceSchemaEntry[] = [];

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
				relativeFolder: folder.filePath,
				folderName: path.basename(folder.filePath),
				collection: parsed.data,
				source: parsed.data.source as SourceSchemaEntry['source'],
			});
		} catch {
			// Malformed collections shouldn't break the sidebar; skip them.
		}
	}

	out.sort((a, b) => a.relativeFolder.localeCompare(b.relativeFolder));
	return out;
}
