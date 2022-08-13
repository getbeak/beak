import { IpcMain } from 'electron';

import { NotificationPreferences } from '../types/preferences';
import { ThemeMode } from '../types/theme';
import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const PreferencesMessages = {
	GetEnvironment: 'get_environment',
	SwitchEnvironment: 'switch_environment',
	GetNotificationValue: 'get_notification_value',
	SetNotificationValue: 'set_notification_value',
	GetThemeMode: 'get_theme_mode',
	SwitchThemeMode: 'switch_theme_mode',
	ResetConfig: 'reset_config',
	SignOut: 'sign_out',
};

export interface SetNotificationValueReq {
	key: keyof NotificationPreferences;
	value: NotificationPreferences[keyof NotificationPreferences];
}

export class IpcPreferencesServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('preferences', ipc);
	}

	async getEnvironment() {
		return this.invoke<string>(PreferencesMessages.GetEnvironment);
	}

	async switchEnvironment(environment: string) {
		return this.invoke(PreferencesMessages.SwitchEnvironment, environment);
	}

	async getNotificationValue<Key extends keyof NotificationPreferences>(key: Key) {
		return this.invoke<NotificationPreferences[Key]>(PreferencesMessages.GetNotificationValue, key);
	}

	// eslint-disable-next-line max-len
	async setNotificationValue<Key extends keyof NotificationPreferences>(key: Key, value: NotificationPreferences[Key]) {
		return this.invoke(PreferencesMessages.SetNotificationValue, { key, value });
	}

	async getThemeMode() {
		return this.invoke<ThemeMode>(PreferencesMessages.GetThemeMode);
	}

	async switchThemeMode(themeMode: ThemeMode) {
		return this.invoke(PreferencesMessages.SwitchThemeMode, themeMode);
	}

	async resetConfig() {
		return this.invoke(PreferencesMessages.ResetConfig);
	}

	async signOut() {
		return this.invoke(PreferencesMessages.SignOut);
	}
}

export class IpcPreferencesServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('preferences', ipc);
	}

	registerGetEnvironment(fn: Listener<void, string>) {
		this.registerListener(PreferencesMessages.GetEnvironment, fn);
	}

	registerSwitchEnvironment(fn: Listener<string>) {
		this.registerListener(PreferencesMessages.SwitchEnvironment, fn);
	}

	// eslint-disable-next-line max-len
	registerGetNotificationValue<Key extends keyof NotificationPreferences>(fn: Listener<Key, Key>) {
		this.registerListener(PreferencesMessages.GetNotificationValue, fn);
	}

	registerSetNotificationValue(fn: Listener<SetNotificationValueReq, void>) {
		this.registerListener(PreferencesMessages.SetNotificationValue, fn);
	}

	registerGetThemeMode(fn: Listener<void, ThemeMode>) {
		this.registerListener(PreferencesMessages.GetThemeMode, fn);
	}

	registerSwitchThemeMode(fn: Listener<ThemeMode>) {
		this.registerListener(PreferencesMessages.SwitchThemeMode, fn);
	}

	registerResetConfig(fn: Listener<void>) {
		this.registerListener(PreferencesMessages.ResetConfig, fn);
	}

	registerSignOut(fn: Listener<void>) {
		this.registerListener(PreferencesMessages.SignOut, fn);
	}
}
