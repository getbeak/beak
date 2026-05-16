import type { CollectionFile } from '@beak/state/schemas';
import { collectionFileSchema } from '@beak/state/schemas';
import path from 'path-browserify';

import { ipcFsService } from '../../../lib/ipc';

const COLLECTION_FILENAME = '_collection.json';

export interface CreateGraphqlEndpointInput {
	folderName: string;
	endpoint: string;
}

export interface UpdateGraphqlEndpointInput {
	endpoint?: string;
}

/**
 * Create a new GraphQL endpoint folder under `tree/`. Writes a fresh
 * `_collection.json` declaring the graphql source. v1 keeps the on-disk
 * shape minimal — just `{ type: 'graphql', endpoint }` — so we don't
 * commit to richer config (auth headers, auto-sync, etc.) until the
 * surface for it lands.
 */
export async function createGraphqlEndpointFolder(
	projectFolderPath: string,
	input: CreateGraphqlEndpointInput,
): Promise<{ folderPath: string }> {
	const folderPath = path.join(projectFolderPath, 'tree', input.folderName);
	if (await ipcFsService.pathExists(folderPath))
		throw new Error(`A folder named "${input.folderName}" already exists at the top of the tree.`);

	const collection: CollectionFile = {
		source: {
			type: 'graphql',
			endpoint: input.endpoint,
		},
	};
	// Validate before persisting so a malformed input fails fast.
	collectionFileSchema.parse(collection);

	await ipcFsService.ensureDir(folderPath);
	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	await ipcFsService.writeJson(collectionPath, collection, { spaces: '\t' });

	return { folderPath };
}

/**
 * Mutate an existing graphql collection's `_collection.json` in place.
 * Reads, applies the patch, validates, writes back. Caller guarantees
 * the target IS a graphql source (the enumerator filters for that).
 */
export async function updateGraphqlEndpoint(
	folderPath: string,
	patch: UpdateGraphqlEndpointInput,
): Promise<void> {
	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	const raw = await ipcFsService.readJson<unknown>(collectionPath);
	const parsed = collectionFileSchema.safeParse(raw);
	if (!parsed.success) throw new Error(`Collection at ${collectionPath} failed schema validation.`);
	if (parsed.data.source.type !== 'graphql')
		throw new Error(`Collection at ${collectionPath} is not a graphql source.`);

	const next: CollectionFile = {
		...parsed.data,
		source: {
			...parsed.data.source,
			...(patch.endpoint !== undefined ? { endpoint: patch.endpoint } : {}),
		},
	};

	const revalidated = collectionFileSchema.safeParse(next);
	if (!revalidated.success) throw new Error('Updated collection failed schema validation.');

	await ipcFsService.writeJson(collectionPath, revalidated.data, { spaces: '\t' });
}
