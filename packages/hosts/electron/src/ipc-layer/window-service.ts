import { IpcWindowServiceMain } from '@beak/shared-common/ipc/window';
import { ipcMain, IpcMainInvokeEvent } from 'electron';

import { closeWindow, createWelcomeWindow } from '../window-management';

const service = new IpcWindowServiceMain(ipcMain);

service.registerCloseSelfWindow(async event => {
	closeWindow((event as IpcMainInvokeEvent).sender.id);
	createWelcomeWindow();
});
