import { IpcFsWatcherServiceMain, StartWatchingReq } from '@beak/common/ipc/fs-watcher';
import chokidar, { WatchOptions } from 'chokidar';
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { FSWatcher } from 'original-fs';

import { ensureWithinProject } from './fs-service';

const watchers: Record<string, FSWatcher> = {};
const windowContentsMapping: Record<string, string[]> = {};

const service = new IpcFsWatcherServiceMain(ipcMain);

service.registerStartWatching(async (event, payload: StartWatchingReq) => {
	await ensureWithinProject(payload.projectFilePath, payload.filePath);

	const sender = (event as IpcMainInvokeEvent).sender;
	const senderIdStr = sender.id.toString();
	const options: WatchOptions = {
		...payload.options,
		followSymlinks: false,
		cwd: void 0,
	};

	const watcher = chokidar
		.watch(payload.filePath, options)
		.on('all', (eventName, path) => {
			service.sendWatcherEvent(sender, payload.sessionIdentifier, { eventName, path });
		})
		.on('error', error => {
			service.sendWatcherError(sender, payload.sessionIdentifier, error);
		});

	watchers[payload.sessionIdentifier] = watcher;

	if (windowContentsMapping[senderIdStr] === void 0)
		windowContentsMapping[senderIdStr] = [];

	windowContentsMapping[senderIdStr].push(payload.sessionIdentifier);
});

service.registerStopWatching(async (_event, sessionIdentifier: string) => {
	watchers[sessionIdentifier]?.close();
});

export function closeWatchersOnWindow(windowContentsId: number) {
	const sessionIdentifiers = windowContentsMapping[windowContentsId.toString()];

	if (!sessionIdentifiers || sessionIdentifiers.length === 0)
		return;

	for (const sessionIdentifier of sessionIdentifiers)
		watchers[sessionIdentifier]?.close();
}
