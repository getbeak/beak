import { IpcFsWatcherServiceMain, type StartWatchingReq } from '@beak/common/ipc/fs-watcher';
import type { ChokidarOptions } from 'chokidar';
import chokidar from 'chokidar';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';
import type { FSWatcher } from 'original-fs';

import { ensureWithinProject } from './fs-service';
import { getProjectFilePathWindowMapping, platformNormalizePath, removeProjectPathPrefix } from './fs-shared';

const watchers: Record<string, FSWatcher> = {};
const windowContentsMapping: Record<string, string[]> = {};

const service = new IpcFsWatcherServiceMain(ipcMain);

service.registerStartWatching(async (event, payload: StartWatchingReq) => {
	const filePath = await ensureWithinProject(getProjectFilePathWindowMapping(event), payload.filePath);

	const sender = (event as IpcMainInvokeEvent).sender;
	const senderIdStr = sender.id.toString();
	const options: ChokidarOptions = {
		...payload.options,
		followSymlinks: false,
		cwd: void 0,
		atomic: true,
	};

	const closeAndForget = () => {
		watcher.close();
		delete watchers[payload.sessionIdentifier];
		const sessions = windowContentsMapping[senderIdStr];
		if (sessions) {
			const next = sessions.filter(s => s !== payload.sessionIdentifier);
			if (next.length === 0) delete windowContentsMapping[senderIdStr];
			else windowContentsMapping[senderIdStr] = next;
		}
	};

	const watcher = chokidar
		.watch(filePath, options)
		.on('all', (eventName, path) => {
			if (eventName !== 'add' && eventName !== 'addDir' && eventName !== 'change' && eventName !== 'unlink' && eventName !== 'unlinkDir') return;
			const destroyed = checkForDestruction(() => {
				service.sendWatcherEvent(sender, payload.sessionIdentifier, {
					eventName,
					path: platformNormalizePath(removeProjectPathPrefix(event, path)),
				});
			});

			if (destroyed) closeAndForget();
		})
		.on('error', error => {
			const destroyed = checkForDestruction(() => {
				service.sendWatcherError(sender, payload.sessionIdentifier, error instanceof Error ? error : new Error(String(error)));
			});

			if (destroyed) closeAndForget();
		});

	// @ts-expect-error
	watchers[payload.sessionIdentifier] = watcher;

	if (windowContentsMapping[senderIdStr] === void 0) windowContentsMapping[senderIdStr] = [];

	windowContentsMapping[senderIdStr].push(payload.sessionIdentifier);
});

service.registerStopWatching(async (_event, sessionIdentifier: string) => {
	const watcher = watchers[sessionIdentifier];
	if (!watcher) return;
	watcher.close();
	delete watchers[sessionIdentifier];
	for (const [winId, sessions] of Object.entries(windowContentsMapping)) {
		const next = sessions.filter(s => s !== sessionIdentifier);
		if (next.length === sessions.length) continue;
		if (next.length === 0) delete windowContentsMapping[winId];
		else windowContentsMapping[winId] = next;
	}
});

// If the window has been closed then the WebContents sender will have been destroyed, in
// this case we need to catch the error, then tell the fs watcher to close.
function checkForDestruction(fn: () => void) {
	try {
		fn();

		return false;
	} catch (error) {
		if (error instanceof Error && error.message !== 'Object has been destroyed') throw error;

		return true;
	}
}

export function closeWatchersOnWindow(windowContentsId: number) {
	const key = windowContentsId.toString();
	const sessionIdentifiers = windowContentsMapping[key];

	if (!sessionIdentifiers || sessionIdentifiers.length === 0) return;

	for (const sessionIdentifier of sessionIdentifiers) {
		watchers[sessionIdentifier]?.close();
		delete watchers[sessionIdentifier];
	}
	delete windowContentsMapping[key];
}
