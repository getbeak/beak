import { IpcDialogServiceMain, ShowMessageBoxReq } from '@beak/shared-common/ipc/dialog';
import { dialog, ipcMain, IpcMainInvokeEvent } from 'electron';

import { windowStack } from '../window-management';

const service = new IpcDialogServiceMain(ipcMain);

service.registerShowMessageBox(async (event, payload: ShowMessageBoxReq) => {
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;
	const result = await dialog.showMessageBox(window, payload);

	return result;
});
