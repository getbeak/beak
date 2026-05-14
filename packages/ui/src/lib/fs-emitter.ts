import type { ChokidarOptions } from 'chokidar';
import path from 'path-browserify';

import { ipcFsService, ipcFsWatcherService } from './ipc';

export interface FsEvent {
	type: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir' | 'ready';
	path: string;
}

export interface FsSubscription {
	close(): void;
}

/**
 * Subscribe to fs events under `path`. The handler is called for each event;
 * call the returned `close()` to stop watching.
 *
 * Replaces the previous `createFsEmitter` (which returned a redux-saga
 * eventChannel). The new shape works for listener effects, hooks, or any
 * other consumer that wants direct callbacks.
 */
export default function createFsEmitter(
	watchPath: string,
	handler: (event: FsEvent) => void,
	options?: ChokidarOptions,
): FsSubscription {
	const sessionIdentifier = ipcFsWatcherService.generateSessionIdentifier();

	ipcFsWatcherService.registerWatcherEvent(sessionIdentifier, async (_event, payload) => {
		handler({ type: payload.eventName, path: payload.path });
	});

	ipcFsWatcherService.registerWatcherError(sessionIdentifier, async (_event, payload) =>
		console.error(payload),
	);

	ipcFsWatcherService.startWatching(sessionIdentifier, watchPath, { ...options, ignoreInitial: true });

	return {
		close() {
			ipcFsWatcherService.stopWatching(sessionIdentifier);
			ipcFsWatcherService.unregisterWatcherError(sessionIdentifier);
			ipcFsWatcherService.unregisterWatcherEvent(sessionIdentifier);
		},
	};
}

export interface ScanResult {
	path: string;
	isDirectory: boolean;
}

export async function scanDirectoryRecursively(dir: string, allowAllFiles?: boolean) {
	const items: ScanResult[] = [];

	for await (const item of scanDirectoryRecursivelyIter(dir, allowAllFiles)) items.push(item);

	return items;
}

async function* scanDirectoryRecursivelyIter(
	dir: string,
	allowAllFiles?: boolean,
): AsyncGenerator<ScanResult, void, void> {
	const dirents = await ipcFsService.readDir(dir, { withFileTypes: true });

	for (const dirent of dirents) {
		const res = path.join(dir, dirent.name);
		const extension = path.extname(dirent.name);

		if (dirent.isDirectory) {
			yield { path: res, isDirectory: true };

			yield* scanDirectoryRecursivelyIter(res, allowAllFiles);
		} else if (allowAllFiles || extension === '.json') {
			yield { path: res, isDirectory: false };
		}
	}
}
