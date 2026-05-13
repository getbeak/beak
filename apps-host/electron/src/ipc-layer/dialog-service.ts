import { IpcDialogServiceMain, type ShowMessageBoxReq } from '@beak/common/ipc/dialog';
import { dialog, type IpcMainInvokeEvent, ipcMain } from 'electron';

import { windowStack } from '../window-management';

const service = new IpcDialogServiceMain(ipcMain);

service.registerShowMessageBox(async (event, payload: ShowMessageBoxReq) => {
	// biome-ignore lint/style/noNonNullAssertion: the IPC sender's window is always
	// registered in `windowStack` by the time it can invoke an IPC handler — the
	// renderer only loads after `createWindow` records the window. A missing entry
	// would indicate a teardown race, not a normal flow.
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;
	const result = await dialog.showMessageBox(window, payload);

	return result;
});
