import { IpcExplorerServiceMain } from '@beak/shared-common/ipc/explorer';
import { clipboard, ipcMain, shell } from 'electron';
import path from 'path';

import { getProjectWindowMapping } from './fs-shared';

const service = new IpcExplorerServiceMain(ipcMain);

service.registerRevealFile(async (event, payload: string) => {
	const projectPath = getProjectWindowMapping(event);

	shell.showItemInFolder(path.join(projectPath, '..', payload));
});

service.registerCopyFullNodePath(async (event, payload: string) => {
	const projectPath = getProjectWindowMapping(event);

	clipboard.writeText(path.join(projectPath, '..', payload));
});

service.registerLaunchUrl(async (_event, url: string) => {
	shell.openExternal(url);
});
