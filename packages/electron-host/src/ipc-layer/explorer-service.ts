import { IpcExplorerServiceMain } from '@beak/common/ipc/explorer';
import { ipcMain, shell } from 'electron';

const service = new IpcExplorerServiceMain(ipcMain);

service.registerRevealFile(async (_event, payload: string) => {
	shell.showItemInFolder(payload);
});

service.registerLaunchUrl(async (_event, url: string) => {
	shell.openExternal(url);
});
