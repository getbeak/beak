import { IpcExplorerServiceMain } from '@beak/common/ipc/explorer';
import { ipcMain, shell } from 'electron';

const service = new IpcExplorerServiceMain(ipcMain);

service.registerRevealFile(async (_event, payload: string) => {
	shell.showItemInFolder(payload);
});
