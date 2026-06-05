import { IpcDialogServiceMain, type ShowMessageBoxReq, type ShowOpenDialogReq } from '@beak/common/ipc/dialog';
import { dialog, type IpcMainInvokeEvent, ipcMain } from 'electron';

import { windowStack } from '../window-management';

const service = new IpcDialogServiceMain(ipcMain);

service.registerShowMessageBox(async (event, payload: ShowMessageBoxReq) => {
	// The IPC sender's window is registered in `windowStack` before the renderer
	// can invoke any handler (createWindow records it before loadURL). A missing
	// entry would indicate a teardown race, not a normal flow.
	// biome-ignore lint/style/noNonNullAssertion: see above
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;
	const result = await dialog.showMessageBox(window, payload);

	return result;
});

service.registerShowOpenDialog(async (event, payload: ShowOpenDialogReq) => {
	// biome-ignore lint/style/noNonNullAssertion: see registerShowMessageBox
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;
	const result = await dialog.showOpenDialog(window, payload);

	return result;
});
