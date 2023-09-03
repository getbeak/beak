import { IpcExplorerServiceMain } from '@beak/common/ipc/explorer';

import { webIpcMain } from './ipc';

const service = new IpcExplorerServiceMain(webIpcMain);

service.registerCopyFullNodePath(async () => console.warn('Not implemented: `registerCopyFullNodePath`'));
service.registerLaunchUrl(async (_event, url) => window.open(url, '_blank'));
service.registerRevealFile(async () => console.warn('Not implemented: `registerRevealFile`'));
