import { IpcArbiterServiceMain } from '@beak/shared-common/ipc/arbiter';
import { ipcMain } from 'electron';

import arbiter from '../lib/arbiter';

const service = new IpcArbiterServiceMain(ipcMain);

service.registerGetStatus(async () => arbiter.getStatus());
