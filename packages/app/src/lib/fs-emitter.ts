import type { WatchOptions } from 'chokidar';
import path from 'path-browserify';
import { eventChannel } from 'redux-saga';

import { ipcFsService, ipcFsWatcherService } from './ipc';

export default function createFsEmitter(path: string, options?: WatchOptions) {
	const sessionIdentifier = ipcFsWatcherService.generateSessionIdentifier();

	const channel = eventChannel(emitter => {
		ipcFsWatcherService.registerWatcherEvent(sessionIdentifier, async (_event, payload) => {
			emitter({ type: payload.eventName, path: payload.path });
		});

		ipcFsWatcherService.registerWatcherError(sessionIdentifier, async (_event, payload) =>
			console.error(payload),
		);

		return () => {
			ipcFsWatcherService.stopWatching(sessionIdentifier);
			ipcFsWatcherService.unregisterWatcherError(sessionIdentifier);
			ipcFsWatcherService.unregisterWatcherEvent(sessionIdentifier);
		};
	});

	ipcFsWatcherService.startWatching(sessionIdentifier, path, { ...options, ignoreInitial: true });

	return channel;
}

export interface ScanResult {
	path: string;
	isDirectory: boolean;
}

export async function scanDirectoryRecursively(dir: string, allowAllFiles?: boolean) {
	const items: ScanResult[] = [];

	for await (const item of scanDirectoryRecursivelyIter(dir, allowAllFiles))
		items.push(item);

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
