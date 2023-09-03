import { IpcFsWatcherServiceMain } from '@beak/common/ipc/fs-watcher';

import { webIpcMain } from './ipc';

const service = new IpcFsWatcherServiceMain(webIpcMain);

service.registerStartWatching(async (_event, _payload) => {
	// Do nothing
});

service.registerStopWatching(async (_event, _sessionIdentifier) => {
	// Do nothing
});
