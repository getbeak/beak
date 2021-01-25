import { IpcWindowServiceMain } from '@beak/common/ipc/window';
import { ipcMain } from 'electron';
import { closeWindow, createWelcomeWindow } from '../window-management';

const service = new IpcWindowServiceMain(ipcMain);

service.registerCloseSelfWindow(async (event) => {
	closeWindow(event.sender.id);
	createWelcomeWindow();
});
