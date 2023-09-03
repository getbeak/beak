import { IpcBeakHubServiceMain } from '@beak/common/ipc/beak-hub';

import getBeakHost from '../host';
import { webIpcMain } from './ipc';

const service = new IpcBeakHubServiceMain(webIpcMain);

service.registerListRecentProjects(async () => await getBeakHost().project.recents.listProjects());
