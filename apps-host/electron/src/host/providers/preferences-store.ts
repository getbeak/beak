import type { Environment } from '@beak/common/types/beak';
import type { EditorPreferences, NotificationPreferences } from '@beak/common/types/preferences';
import type { ThemeMode } from '@beak/common/types/theme';
import PreferencesStore, { type PreferencesChangeEvent } from '@beak/runtime-shared/ports/preferences-store';
import { BrowserWindow } from 'electron';

import type StorageProvider from './storage';

type ChangeListener = (event: PreferencesChangeEvent) => void;

export default class ElectronPreferencesStore extends PreferencesStore {
	private readonly storage: StorageProvider;
	private readonly listeners = new Set<ChangeListener>();

	constructor(storage: StorageProvider) {
		super();
		this.storage = storage;
	}

	async getEnvironment(): Promise<Environment> {
		// electron-store always returns the default value; cast is safe here.
		return (await this.storage.get('environment')) as unknown as Environment;
	}

	async getEditorOverview(): Promise<EditorPreferences> {
		return (await this.storage.get('editor')) as unknown as EditorPreferences;
	}

	async getEditorValue<Key extends keyof EditorPreferences>(key: Key): Promise<EditorPreferences[Key]> {
		const val = await this.storage.get(`editor.${String(key)}` as unknown as 'editor');
		return val as unknown as EditorPreferences[Key];
	}

	async setEditorValue<Key extends keyof EditorPreferences>(key: Key, value: EditorPreferences[Key]): Promise<void> {
		await this.storage.set(`editor.${String(key)}` as unknown as 'editor', value as never);

		const event: PreferencesChangeEvent = { type: 'editor_updated' };

		// Notify in-process listeners.
		for (const listener of this.listeners) listener(event);

		// Multicast to every renderer window.
		for (const win of BrowserWindow.getAllWindows()) {
			win.webContents.send('editor_preferences_updated');
		}
	}

	async getNotificationOverview(): Promise<NotificationPreferences> {
		return (await this.storage.get('notifications')) as unknown as NotificationPreferences;
	}

	async getNotificationValue<Key extends keyof NotificationPreferences>(
		key: Key,
	): Promise<NotificationPreferences[Key]> {
		const val = await this.storage.get(`notifications.${String(key)}` as unknown as 'notifications');
		return val as unknown as NotificationPreferences[Key];
	}

	async setNotificationValue<Key extends keyof NotificationPreferences>(
		key: Key,
		value: NotificationPreferences[Key],
	): Promise<void> {
		await this.storage.set(`notifications.${String(key)}` as unknown as 'notifications', value as never);
	}

	async getThemeMode(): Promise<ThemeMode> {
		return (await this.storage.get('themeMode')) as unknown as ThemeMode;
	}

	async setThemeMode(mode: ThemeMode): Promise<void> {
		await this.storage.set('themeMode', mode);

		const event: PreferencesChangeEvent = { type: 'theme_mode_updated', themeMode: mode };

		for (const listener of this.listeners) listener(event);

		for (const win of BrowserWindow.getAllWindows()) {
			win.webContents.send('theme_mode_updated', mode);
		}
	}

	onChange(listener: ChangeListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
}
