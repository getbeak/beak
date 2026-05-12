import { IpcWindowServiceMain } from '@beak/common/ipc/window';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

import { closeWindow, createWelcomeWindow, reloadWindow } from '../window-management';

const service = new IpcWindowServiceMain(ipcMain);

service.registerCloseSelfWindow(async event => {
	closeWindow((event as IpcMainInvokeEvent).sender.id);

	await createWelcomeWindow();
});

service.registerReloadSelfWindow(async event => {
	reloadWindow((event as IpcMainInvokeEvent).sender.id);
});

service.registerToggleDeveloperTools(async event => {
	(event as IpcMainInvokeEvent).sender.toggleDevTools();
});
