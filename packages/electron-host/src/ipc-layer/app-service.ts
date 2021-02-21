import { IpcAppServiceMain } from '@beak/common/ipc/app';
import { app, ipcMain } from 'electron';

const service = new IpcAppServiceMain(ipcMain);

service.registerGetVersion(async () => app.getVersion());
