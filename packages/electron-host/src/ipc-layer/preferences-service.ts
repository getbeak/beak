import { IpcPreferencesServiceMain } from '@beak/common/ipc/preferences';
import { ipcMain } from 'electron';

import persistentStore, { Environment } from '../lib/persistent-store';
import { switchEnvironment } from '../utils/environment';

const service = new IpcPreferencesServiceMain(ipcMain);

service.registerGetEnvironment(async () => persistentStore.get('environment'));
service.registerSwitchEnvironment(async (_event, environment) => {
	await switchEnvironment(environment as Environment);
});
