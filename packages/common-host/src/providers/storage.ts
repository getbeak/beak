import { Environment } from '@beak/common/types/beak';
import { RecentProject } from '@beak/common/types/beak-hub';
import { EditorPreferences, NotificationPreferences } from '@beak/common/types/preferences';
import { ThemeMode } from '@beak/common/types/theme';

export type WindowPresence = GenericWindowPresence | ProjectMainWindowPresence;

export interface GenericWindowPresence {
	type: 'generic';
	payload: 'welcome' | 'preferences' | 'portal';
}

export interface ProjectMainWindowPresence {
	type: 'project-main';
	payload: string;
}

export interface WindowState {
	width: number;
	height: number;
	x: number;
	y: number;

	isMaximized: boolean;
	isFullScreen: boolean;

	display: {
		id: number;
		bounds: {
			height: number;
			width: number;
			x: number;
			y: number;
		};
	};
}

export interface GenericStore {
	recents: RecentProject[];
	beakId: string;

	latestKnownVersion: string | null;
	environment: Environment;

	encryptedAuth: string | null;

	referenceFiles: Record<string, Record<string, string>>;

	notifications: NotificationPreferences;
	editor: EditorPreferences;

	passedOnboarding: boolean;
	projectMappings: Record<string, string>;

	themeMode: ThemeMode;

	// The properties below are only used by app's running in the electron host

	windowStates: Record<string, WindowState>;
	previousWindowPresence: WindowPresence[];
}

export default abstract class StorageProvider<T extends GenericStore> {
	protected readonly defaults: T;

	constructor(defaults: T) {
		this.defaults = defaults;
	}

	abstract get<Key extends keyof T>(key: Key): Promise<T[Key]>;
	abstract get<Key extends keyof T>(key: Key, defaultValue: Required<T>[Key]): Promise<T[Key]>;
	abstract get<Key extends string, Value = unknown>(key: Exclude<Key, keyof T>, defaultValue?: Value): Value;

	abstract reset<Key extends keyof T>(...keys: Key[]): Promise<void>;

	abstract set<Key extends keyof T>(key: Key, value?: T[Key]): Promise<void>;

	abstract has<Key extends keyof T>(key: Key | string): Promise<boolean>;
}
