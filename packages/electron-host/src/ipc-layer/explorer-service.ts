import { IpcExplorerServiceMain } from '@beak/common/ipc/explorer';
import { clipboard, ipcMain, shell } from 'electron';
import path from 'path';

import { getProjectWindowMapping } from './fs-shared';

const service = new IpcExplorerServiceMain(ipcMain);

service.registerRevealFile(async (_event, payload: string) => {
	shell.showItemInFolder(payload);
});

service.registerRevealFile(async (event, payload: string) => {
	const projectPath = getProjectWindowMapping(event);

	clipboard.writeText(path.join(projectPath, payload));
});

service.registerLaunchUrl(async (_event, url: string) => {
	shell.openExternal(url);
});
