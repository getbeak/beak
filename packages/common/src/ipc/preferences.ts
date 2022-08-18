import { IpcMain } from 'electron';

import { EditorPreferences, NotificationPreferences } from '../types/preferences';
import { ThemeMode } from '../types/theme';
import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const PreferencesMessages = {
	GetEnvironment: 'get_environment',
	SwitchEnvironment: 'switch_environment',

	GetNotificationOverview: 'get_notification_overview',
	GetNotificationValue: 'get_notification_value',
	SetNotificationValue: 'set_notification_value',

	GetEditorOverview: 'get_editor_overview',
	GetEditorValue: 'get_editor_value',
	SetEditorValue: 'set_editor_value',

	GetThemeMode: 'get_theme_mode',
	SwitchThemeMode: 'switch_theme_mode',
	ResetConfig: 'reset_config',
	SignOut: 'sign_out',
};

export interface SetNotificationValueReq {
	key: keyof NotificationPreferences;
	value: NotificationPreferences[keyof NotificationPreferences];
}

export interface SetEditorValueReq {
	key: keyof EditorPreferences;
	value: EditorPreferences[keyof EditorPreferences];
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

	async getNotificationOverview() {
		return this.invoke<NotificationPreferences>(PreferencesMessages.GetNotificationOverview);
	}

	async getNotificationValue<Key extends keyof NotificationPreferences>(key: Key) {
		return this.invoke<NotificationPreferences[Key]>(PreferencesMessages.GetNotificationValue, key);
	}

	// eslint-disable-next-line max-len
	async setNotificationValue<Key extends keyof NotificationPreferences>(key: Key, value: NotificationPreferences[Key]) {
		return this.invoke(PreferencesMessages.SetNotificationValue, { key, value });
	}

	async getEditorOverview() {
		return this.invoke<EditorPreferences>(PreferencesMessages.GetEditorOverview);
	}

	async getEditorValue<Key extends keyof EditorPreferences>(key: Key) {
		return this.invoke<EditorPreferences[Key]>(PreferencesMessages.GetEditorValue, key);
	}

	// eslint-disable-next-line max-len
	async setEditorValue<Key extends keyof EditorPreferences>(key: Key, value: EditorPreferences[Key]) {
		return this.invoke(PreferencesMessages.SetEditorValue, { key, value });
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
	registerGetNotificationOverview(fn: Listener<void, NotificationPreferences>) {
		this.registerListener(PreferencesMessages.GetNotificationOverview, fn);
	}

	// eslint-disable-next-line max-len
	registerGetNotificationValue<Key extends keyof NotificationPreferences>(fn: Listener<Key, NotificationPreferences[Key]>) {
		this.registerListener(PreferencesMessages.GetNotificationValue, fn);
	}

	registerSetNotificationValue(fn: Listener<SetNotificationValueReq, void>) {
		this.registerListener(PreferencesMessages.SetNotificationValue, fn);
	}

	// eslint-disable-next-line max-len
	registerGetEditorOverview(fn: Listener<void, EditorPreferences>) {
		this.registerListener(PreferencesMessages.GetEditorOverview, fn);
	}

	// eslint-disable-next-line max-len
	registerGetEditorValue<Key extends keyof EditorPreferences>(fn: Listener<Key, EditorPreferences[Key]>) {
		this.registerListener(PreferencesMessages.GetEditorValue, fn);
	}

	registerSetEditorValue(fn: Listener<SetEditorValueReq, void>) {
		this.registerListener(PreferencesMessages.SetEditorValue, fn);
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
