import { IpcFsWatcherServiceMain, StartWatchingReq } from '@beak/common/ipc/fs-watcher';
import chokidar, { WatchOptions } from 'chokidar';
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { FSWatcher } from 'original-fs';

import { ensureWithinProject } from './fs-service';
import { getProjectWindowMapping, platformNormalizePath, removeProjectPathPrefix } from './fs-shared';

const watchers: Record<string, FSWatcher> = {};
const windowContentsMapping: Record<string, string[]> = {};

const service = new IpcFsWatcherServiceMain(ipcMain);

service.registerStartWatching(async (event, payload: StartWatchingReq) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);

	const sender = (event as IpcMainInvokeEvent).sender;
	const senderIdStr = sender.id.toString();
	const options: WatchOptions = {
		...payload.options,
		followSymlinks: false,
		cwd: void 0,
	};

	const watcher = chokidar
		.watch(filePath, options)
		.on('all', (eventName, path) => {
			const destroyed = checkForDestruction(() => {
				service.sendWatcherEvent(sender, payload.sessionIdentifier, {
					eventName,
					path: platformNormalizePath(removeProjectPathPrefix(event, path)),
				});
			});

			if (destroyed)
				watcher.close();
		})
		.on('error', error => {
			const destroyed = checkForDestruction(() => {
				service.sendWatcherError(sender, payload.sessionIdentifier, error);
			});

			if (destroyed)
				watcher.close();
		});

	watchers[payload.sessionIdentifier] = watcher;

	if (windowContentsMapping[senderIdStr] === void 0)
		windowContentsMapping[senderIdStr] = [];

	windowContentsMapping[senderIdStr].push(payload.sessionIdentifier);
});

service.registerStopWatching(async (_event, sessionIdentifier: string) => {
	watchers[sessionIdentifier]?.close();
});

// If the window has been closed then the WebContents sender will have been destroyed, in
// this case we need to catch the error, then tell the fs watcher to close.
function checkForDestruction(fn: () => void) {
	try {
		fn();

		return false;
	} catch (error) {
		if (error instanceof Error && error.message !== 'Object has been destroyed')
			throw error;

		return true;
	}
}

export function closeWatchersOnWindow(windowContentsId: number) {
	const sessionIdentifiers = windowContentsMapping[windowContentsId.toString()];

	if (!sessionIdentifiers || sessionIdentifiers.length === 0)
		return;

	for (const sessionIdentifier of sessionIdentifiers)
		watchers[sessionIdentifier]?.close();
}
