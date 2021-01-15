import { IpcBeakHubServiceMain } from '@beak/common/ipc/beak-hub';
import { ipcMain } from 'electron';

import { listRecentProjects } from '../lib/beak-hub';

const service = new IpcBeakHubServiceMain(ipcMain);

service.registerListRecentProjects(async () => await listRecentProjects());
