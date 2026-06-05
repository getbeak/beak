import { completeFlight } from '@beak/state/flight';
import { type CollectionFile, collectionFileSchema } from '@beak/state/schemas';
import { ipcFsService } from '@beak/ui/lib/ipc';
import type { ApplicationState } from '@beak/ui/store';
import type { Tree } from '@getbeak/types/nodes';
import path from 'path-browserify';

import type { AppStartListening } from '../listener';

const COLLECTION_FILENAME = '_collection.json';

/**
 * Stamp `lastSyncedAt` onto a GraphQL endpoint's `_collection.json` when the
 * user runs its discover-schema seed and gets a 2xx response. GraphQL has no
 * dedicated sync IPC — the discover request *is* the sync — so without this
 * the row's "Last synced" indicator would always read "Never synced".
 *
 * Only fires for requests with `info.introspection === true` (the seed flag
 * that GraphQL endpoint folders carry on their generated request file).
 * Non-2xx responses don't touch the file: a failed discover shouldn't lie
 * about freshness.
 */
export function registerEndpointSyncEffects(start: AppStartListening) {
	start({
		actionCreator: completeFlight,
		effect: async (action, api) => {
			const state = api.getState() as ApplicationState;
			const { requestId, response } = action.payload;
			if (response.status < 200 || response.status >= 300) return;

			const node = state.global.project.tree[requestId];
			if (!node || node.type !== 'request' || node.mode !== 'valid') return;
			if (node.info.introspection !== true) return;

			const folderPath = findOwningFolderPath(state.global.project.tree, requestId);
			if (!folderPath) return;
			const collectionPath = path.join(folderPath, COLLECTION_FILENAME);

			try {
				if (!(await ipcFsService.pathExists(collectionPath))) return;
				const raw = await ipcFsService.readJson<unknown>(collectionPath);
				const parsed = collectionFileSchema.safeParse(raw);
				if (!parsed.success) return;
				if (parsed.data.source.type !== 'graphql') return;
				const next: CollectionFile = {
					...parsed.data,
					source: { ...parsed.data.source, lastSyncedAt: new Date().toISOString() },
				};
				const revalidated = collectionFileSchema.safeParse(next);
				if (!revalidated.success) return;
				await ipcFsService.writeJson(collectionPath, revalidated.data, { spaces: '\t' });
			} catch (error) {
				console.warn('endpoint sync stamp failed', error);
			}
		},
	});
}

function findOwningFolderPath(tree: Tree, requestId: string): string | null {
	const node = tree[requestId];
	if (!node) return null;
	let parentId: string | null = node.parent;
	while (parentId) {
		const parent = tree[parentId];
		if (!parent) return null;
		if (parent.type === 'folder') return parent.filePath;
		parentId = parent.parent;
	}
	return null;
}
