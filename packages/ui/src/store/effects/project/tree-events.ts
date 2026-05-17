import ksuid from '@beak/ksuid';
import {
	attemptReconciliation,
	insertFolderNode,
	insertRequestNode,
	removeNodeFromStoreByPath,
} from '@beak/state/project';
import { closeTab } from '@beak/state/tabs';
import { purgeRequestRefs } from '@beak/state/workflows';
import type { TreeEvent } from '@beak/ui/lib/fs-emitter';
import { consumeAddEvent, consumeRemoveEvent } from '@beak/ui/lib/fs-emitter';
import { readFolderNode } from '@beak/ui/lib/beak-project/folder';
import { readRequestNode } from '@beak/ui/lib/beak-project/request';
import { ipcDialogService, ipcEncryptionService, ipcFsService } from '@beak/ui/lib/ipc';
import type { Tree } from '@getbeak/types/nodes';
import path from 'path-browserify';

import projectActions, { alertInsert } from '../../project/actions';

/**
 * Listener-shaped view of the bits of state the tree-event handlers
 * read. Kept narrow on purpose — listeners shouldn't reach into the
 * full ApplicationState. Lives here so the helpers can be unit-tested
 * with a hand-rolled api object.
 */
export interface ProjectListenerApi {
	getState: () => {
		global: {
			project: {
				tree: Tree;
				latestWrite?: { filePath: string; writtenAt: number };
				linkedDirty: Record<string, boolean>;
				linkedStale: Record<string, boolean>;
			};
		};
		features: {
			tabs: {
				selectedTab: string | undefined;
				activeTabs: Array<{ type: string; payload: string; temporary: boolean }>;
			};
		};
	};
	dispatch: (a: { type: string; [k: string]: unknown }) => unknown;
}

/**
 * If keychain access is missing, drop an inline alert so the UI can prompt
 * the user. Kept here so the project lifecycle isn't bundled into a
 * separate service for what's effectively a single dispatch.
 */
export async function ensureEncryptionAlert(api: ProjectListenerApi) {
	const ok = await ipcEncryptionService.checkStatus();
	if (ok) return;
	api.dispatch(
		alertInsert({
			ident: ksuid.generate('alert').toString(),
			alert: {
				type: 'missing_encryption',
				severity: 'error',
				scope: { kind: 'project' },
			},
		}),
	);
}

/**
 * Translate a `TreeEvent` from the watcher into the right tree-state
 * actions. Splitting it out keeps the orchestrator small and lets us
 * unit-test the mapping without booting redux + the fs emitter.
 */
export async function handleTreeEvent(api: ProjectListenerApi, event: TreeEvent) {
	try {
		switch (event.kind) {
			case 'folder-added': {
				if (consumeAddEvent(event.path)) return;
				const node = await readFolderNode(event.path);
				if (api.getState().global.project.tree[node.id]) return;
				api.dispatch(insertFolderNode(node));
				return;
			}
			case 'folder-removed': {
				if (consumeRemoveEvent(event.path)) return;
				api.dispatch(removeNodeFromStoreByPath(event.path));
				api.dispatch(attemptReconciliation());
				return;
			}
			case 'request-changed': {
				// Debounce self-triggered writes so the renderer's own save
				// doesn't immediately bounce a fresh read through the tree.
				const lastWrite = api.getState().global.project.latestWrite;
				if (lastWrite && lastWrite.filePath === event.path) {
					const expiry = lastWrite.writtenAt + 1000;
					if (expiry > Date.now()) return;
				}
				// If a linked file's user has unsaved in-memory edits, don't
				// clobber redux state — mark the request stale so the reload
				// dialog can ask them on next tab focus.
				const existing = Object.values(api.getState().global.project.tree).find(n => n.filePath === event.path);
				if (existing?.type === 'request' && api.getState().global.project.linkedDirty[existing.id]) {
					api.dispatch(projectActions.linkedStaleMarked({ requestId: existing.id }));
					return;
				}
				const node = await readRequestNode(event.path);
				api.dispatch(insertRequestNode(node));
				return;
			}
			case 'request-added': {
				if (consumeAddEvent(event.path)) return;
				const node = await readRequestNode(event.path);
				api.dispatch(insertRequestNode(node));
				return;
			}
			case 'request-removed': {
				if (consumeRemoveEvent(event.path)) return;
				const tree = api.getState().global.project.tree;
				const node = Object.values(tree).find(n => n.filePath === event.path);
				if (node) api.dispatch(closeTab(node.id));
				api.dispatch(removeNodeFromStoreByPath(event.path));
				api.dispatch(attemptReconciliation());
				if (node && node.type === 'request') {
					api.dispatch(purgeRequestRefs({ requestIds: [node.id] }));
				}
				return;
			}
			case 'collection-changed': {
				// During a renderer-initiated folder rename, the watcher
				// emits collection-changed at the new path. The tree's
				// already been rewritten optimistically — re-reading every
				// request under the folder would just thrash for no reason.
				if (consumeAddEvent(event.path)) return;
				// A collection file changes the merged shape of every request
				// whose nearest collection is this one. Cheapest correct move:
				// re-read every request under the collection's folder; ones
				// shadowed by a deeper `_collection.json` simply re-read with
				// the same merged data (no visible churn).
				await refreshRequestsUnderCollection(api, event.path);
				return;
			}
			case 'collection-removed': {
				if (consumeRemoveEvent(event.path)) return;
				// The schema source IS the collection file — its disappearance
				// orphans every `_provenance`-tagged request under the folder.
				// Strip the now-stale marker so the request loses its "linked
				// to a schema" UI (and future re-syncs of a new collection
				// don't accidentally claim ownership of these files).
				await stripProvenanceUnderCollection(api, event.path);
				await refreshRequestsUnderCollection(api, event.path);
				return;
			}
		}
	} catch (error) {
		if (!(error instanceof Error)) return;
		await ipcDialogService.showMessageBox({
			type: 'error',
			title: 'Project data error',
			message: 'There was a problem reading a file or directory in your project',
			detail: [error.message, error.stack].join('\n'),
		});
	}
}

/**
 * On `_collection.json` removal, strip `_provenance` (and the now-meaningless
 * `introspection` seed marker) from every request file under the orphaned
 * folder. We touch the JSON directly rather than going through
 * `writeRequestNode` so we don't accidentally apply sparse-override diffing
 * against a collection that no longer exists.
 */
async function stripProvenanceUnderCollection(api: ProjectListenerApi, collectionPath: string) {
	const folder = path.dirname(collectionPath);
	const prefix = `${folder}/`;
	const tree = api.getState().global.project.tree;

	const affected = Object.values(tree).filter(
		n => n.type === 'request' && (n.parent === folder || (n.parent ?? '').startsWith(prefix)),
	);

	await Promise.all(
		affected.map(async n => {
			try {
				const raw = await ipcFsService.readJson<Record<string, unknown>>(n.filePath);
				if (raw == null || typeof raw !== 'object') return;
				const { _provenance, introspection, ...rest } = raw;
				if (_provenance === undefined && introspection === undefined) return;
				await ipcFsService.writeJson(n.filePath, rest, { spaces: '\t' });
			} catch (err) {
				console.warn('failed to strip provenance from', n.filePath, err);
			}
		}),
	);
}

async function refreshRequestsUnderCollection(api: ProjectListenerApi, collectionPath: string) {
	const folder = path.dirname(collectionPath);
	const prefix = `${folder}/`;
	const tree = api.getState().global.project.tree;
	const linkedDirty = api.getState().global.project.linkedDirty;

	const affected = Object.values(tree).filter(
		n => n.type === 'request' && (n.parent === folder || (n.parent ?? '').startsWith(prefix)),
	);

	await Promise.all(
		affected.map(async n => {
			// Mirror request-changed: protect in-memory edits on dirty linked
			// files. Mark them stale so the reload dialog picks it up.
			if (linkedDirty[n.id]) {
				api.dispatch(projectActions.linkedStaleMarked({ requestId: n.id }));
				return;
			}
			const refreshed = await readRequestNode(n.filePath);
			api.dispatch(insertRequestNode(refreshed));
		}),
	);
}
