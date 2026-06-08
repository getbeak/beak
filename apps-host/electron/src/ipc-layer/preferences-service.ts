import { IpcPreferencesServiceMain } from '@beak/common/ipc/preferences';
import type { Environment } from '@beak/common/types/beak';
import { app, ipcMain } from 'electron';

import getBeakHost from '../host';
import { setThemeMode } from '../lib/theme-manager';
import { switchEnvironment } from '../utils/environment';

const service = new IpcPreferencesServiceMain(ipcMain);

service.registerGetEnvironment(async () => await getBeakHost().providers.preferences.getEnvironment());

service.registerGetNotificationOverview(
	async () => await getBeakHost().providers.preferences.getNotificationOverview(),
);
service.registerGetNotificationValue(
	async (_event, key) => await getBeakHost().providers.preferences.getNotificationValue(key),
);
service.registerSetNotificationValue(async (_event, { key, value }) => {
	await getBeakHost().providers.preferences.setNotificationValue(key, value);
});

service.registerGetEditorOverview(async () => await getBeakHost().providers.preferences.getEditorOverview());
service.registerGetEditorValue(async (_event, key) => await getBeakHost().providers.preferences.getEditorValue(key));
service.registerSetEditorValue(async (_event, { key, value }) => {
	await getBeakHost().providers.preferences.setEditorValue(key, value);
});

service.registerGetThemeMode(async () => await getBeakHost().providers.preferences.getThemeMode());

service.registerSwitchEnvironment(async (_event, environment) => {
	await switchEnvironment(environment as Environment);
});
service.registerSwitchThemeMode(async (_event, themeMode) => {
	// setThemeMode keeps nativeTheme in sync (Electron OS-level); the adapter
	// handles persistence + renderer multicast.
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
