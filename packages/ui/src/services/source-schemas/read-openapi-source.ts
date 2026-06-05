import { type CollectionSource, collectionFileSchema } from '@beak/state/schemas';
import { ipcFsService } from '@beak/ui/lib/ipc';
import path from 'path-browserify';

const COLLECTION_FILENAME = '_collection.json';

/**
 * Read the owning folder's `_collection.json` and surface its `openapi`
 * source if the collection is an OpenAPI source. Returns `null` for any
 * other shape (missing file, parse error, manual/graphql/grpc source).
 *
 * Lifted out of `OpenApiSyncBanner.tsx` so the read-validate-narrow chain
 * lives next to its sibling source-schemas services. The banner now just
 * subscribes to the result.
 */
export async function readOpenApiSource(
	folderPath: string,
): Promise<Extract<CollectionSource, { type: 'openapi' }> | null> {
	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	if (!(await ipcFsService.pathExists(collectionPath))) return null;
	try {
		const raw = await ipcFsService.readJson<unknown>(collectionPath);
		const parsed = collectionFileSchema.safeParse(raw);
		if (!parsed.success || parsed.data.source.type !== 'openapi') return null;
		return parsed.data.source;
	} catch {
		return null;
	}
}
