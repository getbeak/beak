import { ipcMain } from 'electron';

import { listRecentProjects } from '../lib/beak-hub';

ipcMain.handle('beak_hub:list_recents', async () => await listRecentProjects());
