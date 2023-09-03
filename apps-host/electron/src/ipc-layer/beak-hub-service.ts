import { IpcBeakHubServiceMain } from '@beak/common/ipc/beak-hub';
import { ipcMain } from 'electron';

import getBeakHost from '../host';

const service = new IpcBeakHubServiceMain(ipcMain);

service.registerListRecentProjects(async () => await getBeakHost().project.recents.listProjects());
