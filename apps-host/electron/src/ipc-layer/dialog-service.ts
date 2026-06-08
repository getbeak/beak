import { IpcDialogServiceMain, type ShowMessageBoxReq, type ShowOpenDialogReq } from '@beak/common/ipc/dialog';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

import ElectronDialog from '../adapters/dialog';
import { windowStack } from '../window-management';

const service = new IpcDialogServiceMain(ipcMain);

service.registerShowMessageBox(async (event, payload: ShowMessageBoxReq) => {
	// The IPC sender's window is registered in `windowStack` before the renderer
	// can invoke any handler (createWindow records it before loadURL). A missing
	// entry would indicate a teardown race, not a normal flow.
	// biome-ignore lint/style/noNonNullAssertion: see above
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;

	return new ElectronDialog(window).showMessageBox(payload);
});

service.registerShowOpenDialog(async (event, payload: ShowOpenDialogReq) => {
	// biome-ignore lint/style/noNonNullAssertion: see registerShowMessageBox
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;

	return new ElectronDialog(window).showOpenDialog(payload);
});
