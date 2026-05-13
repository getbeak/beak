import { IpcWindowServiceMain } from '@beak/common/ipc/window';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

import { openUntitledProject } from '../host/extensions/project';
import { closeWindow, reloadWindow, windowStack } from '../window-management';

const service = new IpcWindowServiceMain(ipcMain);

service.registerCloseSelfWindow(async event => {
	const senderId = (event as IpcMainInvokeEvent).sender.id;
	closeWindow(senderId);

	// If there are no remaining project windows, spin up an untitled one so
	// the user isn't left in a windowless state (welcome screen no longer
	// exists). On macOS this matches the "app stays alive without windows"
	// convention — the next dock-icon click will land on the untitled.
	if (Object.keys(windowStack).length === 0) {
		try {
			await openUntitledProject();
		} catch (err) {
			console.warn('[window-service] failed to open untitled project after close', err);
		}
	}
});

service.registerReloadSelfWindow(async event => {
	reloadWindow((event as IpcMainInvokeEvent).sender.id);
});

service.registerToggleDeveloperTools(async event => {
	(event as IpcMainInvokeEvent).sender.toggleDevTools();
});
