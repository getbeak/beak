import { IpcWindowServiceMain } from '@beak/common/ipc/window';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

import { closeWindow, createEmptyProjectMainWindow, reloadWindow, windowStack } from '../window-management';

const service = new IpcWindowServiceMain(ipcMain);

service.registerCloseSelfWindow(async event => {
	const senderId = (event as IpcMainInvokeEvent).sender.id;
	closeWindow(senderId);

	// If there are no remaining windows, open an empty workbench so the user
	// isn't left in a windowless state. On macOS this matches the "app stays
	// alive without windows" convention — the next dock-icon click lands on
	// the empty workbench (welcome tab) rather than killing the process.
	if (Object.keys(windowStack).length === 0) {
		try {
			await createEmptyProjectMainWindow();
		} catch (err) {
			console.warn('[window-service] failed to open empty workbench after close', err);
		}
	}
});

service.registerReloadSelfWindow(async event => {
	reloadWindow((event as IpcMainInvokeEvent).sender.id);
});

service.registerToggleDeveloperTools(async event => {
	(event as IpcMainInvokeEvent).sender.toggleDevTools();
});
