import type { EditorPreferences, NotificationPreferences } from '../types/preferences';
import type { ThemeMode } from '../types/theme';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

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

export class IpcPreferencesServiceRenderer extends IpcServiceRenderer<'preferences'> {
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

export class IpcPreferencesServiceMain extends IpcServiceMain<'preferences'> {
	constructor(ipc: PartialIpcMain) {
		super('preferences', ipc);
	}

	registerGetEnvironment(fn: IpcListener<void>) {
		this.registerRequestHandler(PreferencesMessages.GetEnvironment, fn);
	}

	registerSwitchEnvironment(fn: IpcListener<string>) {
		this.registerRequestHandler(PreferencesMessages.SwitchEnvironment, fn);
	}

	registerGetNotificationOverview(fn: IpcListener<void>) {
		this.registerRequestHandler(PreferencesMessages.GetNotificationOverview, fn);
	}

	registerGetNotificationValue<Key extends keyof NotificationPreferences>(fn: IpcListener<Key>) {
		this.registerRequestHandler(PreferencesMessages.GetNotificationValue, fn);
	}

	registerSetNotificationValue(fn: IpcListener<SetNotificationValueReq>) {
		this.registerRequestHandler(PreferencesMessages.SetNotificationValue, fn);
	}

	registerGetEditorOverview(fn: IpcListener<void>) {
		this.registerRequestHandler(PreferencesMessages.GetEditorOverview, fn);
	}

	registerGetEditorValue<Key extends keyof EditorPreferences>(fn: IpcListener<Key>) {
		this.registerRequestHandler(PreferencesMessages.GetEditorValue, fn);
	}

	registerSetEditorValue(fn: IpcListener<SetEditorValueReq>) {
		this.registerRequestHandler(PreferencesMessages.SetEditorValue, fn);
	}

	registerGetThemeMode(fn: IpcListener<void>) {
		this.registerRequestHandler(PreferencesMessages.GetThemeMode, fn);
	}

	registerSwitchThemeMode(fn: IpcListener<ThemeMode>) {
		this.registerRequestHandler(PreferencesMessages.SwitchThemeMode, fn);
	}

	registerResetConfig(fn: IpcListener<void>) {
		this.registerRequestHandler(PreferencesMessages.ResetConfig, fn);
	}

	registerSignOut(fn: IpcListener<void>) {
		this.registerRequestHandler(PreferencesMessages.SignOut, fn);
	}
}
