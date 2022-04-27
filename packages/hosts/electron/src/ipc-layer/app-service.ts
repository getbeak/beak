import { IpcAppServiceMain } from '@beak/shared-common/ipc/app';
import { app, ipcMain } from 'electron';

const service = new IpcAppServiceMain(ipcMain);

service.registerGetVersion(async () => app.getVersion());
service.registerGetPlatform(async () => process.platform);
