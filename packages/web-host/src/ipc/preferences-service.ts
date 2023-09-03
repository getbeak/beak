import { IpcPreferencesServiceMain } from '@beak/common/ipc/preferences';

import getBeakHost from '../host';
import { webIpcMain } from './ipc';

const service = new IpcPreferencesServiceMain(webIpcMain);

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

	// TODO(afr): Handle updating via `editor_preferences_updated`
});

service.registerGetThemeMode(async () => await getBeakHost().providers.storage.get('themeMode'));

service.registerSwitchEnvironment(async (_event, _environment) => {
	// await switchEnvironment(environment as Environment);
});
service.registerSwitchThemeMode(async (_event, _themeMode) => {
	// await setThemeMode(themeMode);
});

service.registerResetConfig(async () => {
	await getBeakHost().providers.storage.reset();

	window.location.reload();
});

service.registerSignOut(async () => {
	window.location.reload();
});
