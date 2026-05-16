import type { CollectionFile } from '@beak/state/schemas';
import { collectionFileSchema } from '@beak/state/schemas';
import path from 'path-browserify';

import { ipcFsService } from '../../../lib/ipc';

const COLLECTION_FILENAME = '_collection.json';

export interface UpdateSyncConfigArgs {
	folderPath: string;
	autoSync?: boolean;
	intervalMinutes?: number;
}

/**
 * Toggle auto-sync settings on an existing openapi collection without
 * re-fetching the spec. Reads `_collection.json`, mutates the openapi
 * source, validates the result, writes back. Returns the updated file
 * or `null` if the collection isn't openapi-sourced.
 *
 * We re-validate before writing so a buggy caller can't corrupt the
 * file — the schema is the source of truth.
 */
export async function updateSyncConfig(args: UpdateSyncConfigArgs): Promise<CollectionFile | null> {
	const collectionPath = path.join(args.folderPath, COLLECTION_FILENAME);
	if (!(await ipcFsService.pathExists(collectionPath))) return null;

	const raw = await ipcFsService.readJson<unknown>(collectionPath);
	const parsed = collectionFileSchema.safeParse(raw);
	if (!parsed.success) return null;
	if (parsed.data.source.type !== 'openapi') return null;

	const next: CollectionFile = {
		...parsed.data,
		source: {
			...parsed.data.source,
			...(args.autoSync !== undefined ? { autoSync: args.autoSync } : {}),
			...(args.intervalMinutes !== undefined ? { intervalMinutes: args.intervalMinutes } : {}),
		},
	};

	const revalidated = collectionFileSchema.safeParse(next);
	if (!revalidated.success) return null;

	await ipcFsService.writeJson(collectionPath, revalidated.data, { spaces: '\t' });
	return revalidated.data;
}
