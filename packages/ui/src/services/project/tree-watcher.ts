/**
 * TreeWatcherService — owns the project's filesystem subscription.
 *
 * The renderer used to inline this watcher inside the `startProject`
 * effect, which made the effect simultaneously responsible for loading,
 * encryption, and watching — three lifecycles tangled into one closure
 * with no teardown. Pulling the watcher out gives it a single job: emit
 * structured events about what happened in `tree/`. The orchestration
 * effect translates those events into action dispatches.
 */

import createFsEmitter, { type FsSubscription } from '@beak/ui/lib/fs-emitter';
import path from 'path-browserify';

export type TreeEventKind =
	| 'folder-added'
	| 'folder-removed'
	| 'request-added'
	| 'request-changed'
	| 'request-removed'
	| 'collection-changed'
	| 'collection-removed';

export interface TreeEvent {
	kind: TreeEventKind;
	path: string;
}

export type TreeWatcherHandler = (event: TreeEvent) => void | Promise<void>;

const COLLECTION_FILENAME = '_collection.json';

/**
 * Subscribe to fs events under `tree/` and forward them as semantic
 * `TreeEvent`s. Returns the underlying subscription so the caller can
 * tear it down on window close.
 *
 *  - non-`.json` files are ignored.
 *  - `_collection.json` writes become `collection-changed` / `collection-removed`
 *    so the orchestrator can invalidate the requests merged through them.
 *    Other `_`-prefixed files are still ignored (no semantics yet).
 *  - `addDir` / `unlinkDir` become `folder-added` / `folder-removed`.
 *  - `add` / `change` / `unlink` on request `.json` files map to the request
 *    lifecycle events; the watcher does not inspect contents — that's
 *    the orchestrator's job.
 */
export function startTreeWatcher(handler: TreeWatcherHandler, treePath = 'tree'): FsSubscription {
	return createFsEmitter(
		treePath,
		async event => {
			const isDir = event.type === 'addDir' || event.type === 'unlinkDir';

			if (!isDir) {
				if (path.extname(event.path) !== '.json') return;
			}

			const mapped = mapEvent(event.type, event.path);
			if (!mapped) return;

			await handler(mapped);
		},
		{ followSymlinks: false },
	);
}

function mapEvent(type: string, eventPath: string): TreeEvent | null {
	const basename = path.basename(eventPath);
	const isCollection = basename === COLLECTION_FILENAME;
	// Other `_`-prefixed files are reserved-but-unused — drop them so they
	// don't leak through as fake request nodes.
	const isOtherMetadata = !isCollection && basename.startsWith('_');

	switch (type) {
		case 'addDir':
			return { kind: 'folder-added', path: eventPath };
		case 'unlinkDir':
			return { kind: 'folder-removed', path: eventPath };
		case 'add':
		case 'change':
			if (isCollection) return { kind: 'collection-changed', path: eventPath };
			if (isOtherMetadata) return null;
			return { kind: type === 'add' ? 'request-added' : 'request-changed', path: eventPath };
		case 'unlink':
			if (isCollection) return { kind: 'collection-removed', path: eventPath };
			if (isOtherMetadata) return null;
			return { kind: 'request-removed', path: eventPath };
		default:
			return null;
	}
}
