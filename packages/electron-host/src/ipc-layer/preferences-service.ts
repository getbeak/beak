import { TypedObject } from '@beak/common/helpers/typescript';
import { IpcPreferencesServiceMain } from '@beak/common/ipc/preferences';
import { Environment } from '@beak/common/types/beak';
import { app, ipcMain } from 'electron';

import getBeakHost from '../host';
import { setThemeMode } from '../lib/theme-manager';
import { switchEnvironment } from '../utils/environment';
import { windowStack } from '../window-management';

const service = new IpcPreferencesServiceMain(ipcMain);

service.registerGetEnvironment(async () => await getBeakHost().providers.storage.get('environment'));

service.registerGetNotificationOverview(async () => await getBeakHost().providers.storage.get('notifications'));
service.registerGetNotificationValue(async (_event, key) => await getBeakHost().providers.storage.get(`notifications.${key}`));
service.registerSetNotificationValue(async (_event, { key, value }) => {
	await getBeakHost().providers.storage.set(`notifications.${key}`, value);
});

service.registerGetEditorOverview(async () => await getBeakHost().providers.storage.get('editor'));
service.registerGetEditorValue(async (_event, key) => await getBeakHost().providers.storage.get(`editor.${key}`));
service.registerSetEditorValue(async (_event, { key, value }) => {
	await getBeakHost().providers.storage.set(`editor.${key}`, value);

	TypedObject.values(windowStack).forEach(window => {
		if (!window)
			return;

		window.webContents.send('editor_preferences_updated');
	});
});

service.registerGetThemeMode(async () => await getBeakHost().providers.storage.get('themeMode'));

service.registerSwitchEnvironment(async (_event, environment) => {
	await switchEnvironment(environment as Environment);
});
service.registerSwitchThemeMode(async (_event, themeMode) => {
	await setThemeMode(themeMode);
});

service.registerResetConfig(async () => {
	await getBeakHost().providers.storage.reset();

	app.relaunch();
	app.exit();
});

service.registerSignOut(async () => {
	app.relaunch();
	app.exit();
});
