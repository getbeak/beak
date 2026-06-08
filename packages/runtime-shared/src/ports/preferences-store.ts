import type { Environment } from '@beak/common/types/beak';
import type { EditorPreferences, NotificationPreferences } from '@beak/common/types/preferences';
import type { ThemeMode } from '@beak/common/types/theme';

export interface PreferencesChangeEvent {
	type: 'editor_updated' | 'theme_mode_updated';
	/** Populated when type === 'theme_mode_updated'. */
	themeMode?: ThemeMode;
}

/**
 * Port that owns all preferences read/write and change-notification duties.
 * Both the Electron and Web hosts provide a concrete adapter; the IPC
 * preferences-service handlers delegate entirely to this interface.
 */
export default abstract class PreferencesStore {
	abstract getEnvironment(): Promise<Environment>;

	abstract getEditorOverview(): Promise<EditorPreferences>;
	abstract getEditorValue<Key extends keyof EditorPreferences>(key: Key): Promise<EditorPreferences[Key]>;
	abstract setEditorValue<Key extends keyof EditorPreferences>(key: Key, value: EditorPreferences[Key]): Promise<void>;

	abstract getNotificationOverview(): Promise<NotificationPreferences>;
	abstract getNotificationValue<Key extends keyof NotificationPreferences>(
		key: Key,
	): Promise<NotificationPreferences[Key]>;
	abstract setNotificationValue<Key extends keyof NotificationPreferences>(
		key: Key,
		value: NotificationPreferences[Key],
	): Promise<void>;

	abstract getThemeMode(): Promise<ThemeMode>;
	abstract setThemeMode(mode: ThemeMode): Promise<void>;

	/**
	 * Register a listener that receives preference change events emitted by
	 * this host. Returns an unsubscribe function.
	 *
	 * Electron: multicasts to every open BrowserWindow.
	 * Web: fires for the same tab only (single-window shell).
	 */
	abstract onChange(listener: (event: PreferencesChangeEvent) => void): () => void;
}
