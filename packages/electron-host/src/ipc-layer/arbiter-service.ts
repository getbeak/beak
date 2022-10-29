import { IpcArbiterServiceMain } from '@beak/common/ipc/arbiter';
import { ipcMain } from 'electron';

import arbiter from '../lib/arbiter';

const service = new IpcArbiterServiceMain(ipcMain);

service.registerGetStatus(async () => arbiter.getStatus());
service.registerCheckStatus(async () => {
	arbiter.getStatus();
});
