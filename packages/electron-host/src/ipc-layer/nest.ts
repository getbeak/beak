import { ipcMain } from 'electron';

import persistentStore from '../lib/persistent-store';

ipcMain.on('nest:set_user', (_event, userId: string) => {
	persistentStore.set('user', { userId });
});
