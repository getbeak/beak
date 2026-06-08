import { IpcPreferencesServiceMain } from '@beak/common/ipc/preferences';

import getBeakHost from '../host';
import { webIpcMain } from './ipc';

const service = new IpcPreferencesServiceMain(webIpcMain);

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

service.registerSwitchEnvironment(async (_event, _environment) => {
	// Environment switching not implemented in the web host.
});
service.registerSwitchThemeMode(async (_event, themeMode) => {
	await getBeakHost().providers.preferences.setThemeMode(themeMode);
});

service.registerResetConfig(async () => {
	await getBeakHost().providers.storage.reset();

	window.location.reload();
});

service.registerSignOut(async () => {
	window.location.reload();
});
