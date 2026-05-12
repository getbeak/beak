import { IpcDialogServiceMain, type ShowMessageBoxReq } from '@beak/common/ipc/dialog';
import { dialog, type IpcMainInvokeEvent, ipcMain } from 'electron';

import { windowStack } from '../window-management';

const service = new IpcDialogServiceMain(ipcMain);

service.registerShowMessageBox(async (event, payload: ShowMessageBoxReq) => {
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;
	const result = await dialog.showMessageBox(window, payload);

	return result;
});
