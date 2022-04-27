import { IpcBeakHubServiceMain } from '@beak/shared-common/ipc/beak-hub';
import { ipcMain } from 'electron';

import { listRecentProjects } from '../lib/beak-hub';

const service = new IpcBeakHubServiceMain(ipcMain);

service.registerListRecentProjects(async () => await listRecentProjects());
