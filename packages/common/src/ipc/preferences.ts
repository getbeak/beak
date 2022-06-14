import { IpcMain } from 'electron';

import { ThemeMode } from '../types/theme';
import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const PreferencesMessages = {
	GetEnvironment: 'get_environment',
	SwitchEnvironment: 'switch_environment',
	GetThemeMode: 'get_theme_mode',
	SwitchThemeMode: 'switch_theme_mode',
	ResetConfig: 'reset_config',
	SignOut: 'sign_out',
};

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
