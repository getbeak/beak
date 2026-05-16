import type { CollectionFile, CollectionSource } from '@beak/state/schemas';
import { collectionFileSchema } from '@beak/state/schemas';
import path from 'path-browserify';

import { ipcFsService } from '../../../lib/ipc';
import type { EndpointKind } from '../types';

const COLLECTION_FILENAME = '_collection.json';

export interface CreateEndpointInput {
	kind: EndpointKind;
	folderName: string;
	endpoint: string;
}

export interface UpdateEndpointInput {
	endpoint?: string;
}

/**
 * Create a new endpoint folder under `tree/`. Writes a fresh
 * `_collection.json` declaring the corresponding source. The on-disk
 * shape stays minimal — just `{ type, endpoint }` plus optional
 * `lastSyncedAt` — so we don't commit to richer config (auth headers,
 * proto descriptors, etc.) until the surface for it lands.
 */
export async function createEndpointFolder(
	projectFolderPath: string,
	input: CreateEndpointInput,
): Promise<{ folderPath: string }> {
	const folderPath = path.join(projectFolderPath, 'tree', input.folderName);
	if (await ipcFsService.pathExists(folderPath))
		throw new Error(`A folder named "${input.folderName}" already exists at the top of the tree.`);

	const source: CollectionSource =
		input.kind === 'graphql'
			? { type: 'graphql', endpoint: input.endpoint }
			: { type: 'grpc', endpoint: input.endpoint };

	const collection: CollectionFile = { source };
	// Validate before persisting so a malformed input fails fast.
	collectionFileSchema.parse(collection);

	await ipcFsService.ensureDir(folderPath);
	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	await ipcFsService.writeJson(collectionPath, collection, { spaces: '\t' });

	return { folderPath };
}

/**
 * Mutate an existing endpoint collection's `_collection.json` in place.
 * Reads, applies the patch, validates, writes back. Caller guarantees
 * the target IS the expected source kind (the enumerator filters for
 * that).
 */
export async function updateEndpoint(
	folderPath: string,
	kind: EndpointKind,
	patch: UpdateEndpointInput,
): Promise<void> {
	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	const raw = await ipcFsService.readJson<unknown>(collectionPath);
	const parsed = collectionFileSchema.safeParse(raw);
	if (!parsed.success) throw new Error(`Collection at ${collectionPath} failed schema validation.`);
	if (parsed.data.source.type !== kind)
		throw new Error(`Collection at ${collectionPath} is not a ${kind} source.`);

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
