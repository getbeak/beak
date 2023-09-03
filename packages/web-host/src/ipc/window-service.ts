import { IpcWindowServiceMain } from '@beak/common/ipc/window';

import { webIpcMain } from './ipc';

const service = new IpcWindowServiceMain(webIpcMain);

service.registerCloseSelfWindow(async () => {
	// window.location.assign('/');
});

service.registerReloadSelfWindow(async () => {
	window.location.reload();
});

service.registerToggleDeveloperTools(async () => {
	// Not supported
});
