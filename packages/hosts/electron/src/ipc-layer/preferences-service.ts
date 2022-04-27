import { IpcPreferencesServiceMain } from '@beak/shared-common/ipc/preferences';
import { app, ipcMain } from 'electron';

import nestClient from '../lib/nest-client';
import persistentStore, { Environment } from '../lib/persistent-store';
import { switchEnvironment } from '../utils/environment';

const service = new IpcPreferencesServiceMain(ipcMain);

service.registerGetEnvironment(async () => persistentStore.get('environment'));
service.registerSwitchEnvironment(async (_event, environment) => {
	await switchEnvironment(environment as Environment);
});

service.registerResetConfig(async () => {
	persistentStore.reset();
	app.relaunch();
	app.exit();
});

service.registerSignOut(async () => {
	await nestClient.setAuth(null);

	app.relaunch();
	app.exit();
});
