import { listRecentProjects } from '@beak/common/src/beak-hub/recents';
import { ipcMain } from 'electron';

ipcMain.handle('welcome-recents:list', async () => await listRecentProjects());
