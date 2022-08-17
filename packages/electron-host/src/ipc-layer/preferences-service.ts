import { TypedObject } from '@beak/common/helpers/typescript';
import { IpcPreferencesServiceMain } from '@beak/common/ipc/preferences';
import { app, ipcMain } from 'electron';

import nestClient from '../lib/nest-client';
import persistentStore, { Environment } from '../lib/persistent-store';
import { setThemeMode } from '../lib/theme-manager';
import { switchEnvironment } from '../utils/environment';
import { windowStack } from '../window-management';

const service = new IpcPreferencesServiceMain(ipcMain);

service.registerGetEnvironment(async () => persistentStore.get('environment'));

service.registerGetNotificationOverview(async () => persistentStore.get('notifications'));
service.registerGetNotificationValue(async (_event, key) => persistentStore.get(`notifications.${key}`));
service.registerSetNotificationValue(async (_event, { key, value }) => persistentStore.set(`notifications.${key}`, value));

service.registerGetEditorOverview(async () => persistentStore.get('editor'));
service.registerGetEditorValue(async (_event, key) => persistentStore.get(`editor.${key}`));
service.registerSetEditorValue(async (_event, { key, value }) => {
	persistentStore.set(`editor.${key}`, value);

	TypedObject.values(windowStack).forEach(window => {
		if (!window)
			return;

		window.webContents.send('editor_preferences_updated');
	});
});

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
