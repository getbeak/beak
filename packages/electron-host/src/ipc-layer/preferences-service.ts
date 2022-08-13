import { IpcPreferencesServiceMain } from '@beak/common/ipc/preferences';
import { app, ipcMain } from 'electron';

import nestClient from '../lib/nest-client';
import persistentStore, { Environment } from '../lib/persistent-store';
import { setThemeMode } from '../lib/theme-manager';
import { switchEnvironment } from '../utils/environment';

const service = new IpcPreferencesServiceMain(ipcMain);

service.registerGetEnvironment(async () => persistentStore.get('environment'));

service.registerGetNotificationValue(async (_event, key) => persistentStore.get(`notifications.${key}`));
service.registerSetNotificationValue(async (_event, { key, value }) => persistentStore.set(`notifications.${key}`, value));

service.registerGetThemeMode(async () => persistentStore.get('themeMode'));

service.registerSwitchEnvironment(async (_event, environment) => {
	await switchEnvironment(environment as Environment);
});
service.registerSwitchThemeMode(async (_event, themeMode) => {
	await setThemeMode(themeMode);
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
