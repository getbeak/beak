import { type CollectionFile, collectionFileSchema } from '@beak/state/schemas';
import path from 'path-browserify';

import { ipcFsService } from '@beak/ui/lib/ipc';

const COLLECTION_FILENAME = '_collection.json';

/**
 * Load `_collection.json` from a single folder. Returns `null` when no
 * collection lives at that path or when the file fails schema validation —
 * a malformed collection should not crash request loading.
 */
export async function loadCollectionAtFolder(folderPath: string): Promise<CollectionFile | null> {
	const target = path.join(folderPath, COLLECTION_FILENAME);

	if (!(await ipcFsService.pathExists(target))) return null;

	try {
		const raw = await ipcFsService.readJson<unknown>(target);
		const parsed = collectionFileSchema.safeParse(raw);
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

/**
 * Walk up from `folderPath` looking for a `_collection.json`. Stops once it
 * leaves the project's `tree/` directory (collection lookup is scoped to
 * the tree). Returns the *nearest* collection — the immediate folder's
 * collection wins over an ancestor's. Future iterations may merge multiple
 * ancestor collections; today there is no inheritance.
 */
export async function loadNearestCollection(folderPath: string): Promise<CollectionFile | null> {
	let current = folderPath;
	let safety = 32; // pathological deep tree guard

	while (safety-- > 0) {
		const collection = await loadCollectionAtFolder(current);
		if (collection) return collection;

		const parent = path.dirname(current);
		if (!parent || parent === current) return null;

		const segments = current.split('/').filter(Boolean);
		const treeIdx = segments.lastIndexOf('tree');
		// Stop when we've walked past the last `tree/` segment — collections
		// only live inside the project's tree directory.
		if (treeIdx === -1) return null;

		current = parent;
	}

	return null;
}

/**
 * Convenience: load the nearest collection for the folder that holds a
 * given request file.
 */
export async function loadCollectionForRequest(requestFilePath: string): Promise<CollectionFile | null> {
	return loadNearestCollection(path.dirname(requestFilePath));
}
