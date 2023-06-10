/* eslint-disable max-len */
/* eslint-disable no-dupe-class-members */

import StorageProviderBase, { GenericStore } from '@beak/common-host/providers/storage';
import { WindowState } from '@beak/electron-host/lib/window-state-manager';
import PersistentStore from 'electron-store';

export default class StorageProvider extends StorageProviderBase<ElectronStore> {
	private readonly store: PersistentStore<ElectronStore>;

	constructor(defaults: ElectronStore) {
		super(defaults);

		this.store = new PersistentStore<ElectronStore>({
			defaults: this.defaults,
		});
	}

	get<Key extends keyof ElectronStore>(key: Key): Promise<ElectronStore[Key] | null>;
	get<Key extends keyof ElectronStore>(
		key: Key,
		defaultValue: Required<ElectronStore>[Key],
	): Promise<ElectronStore[Key]>;
	get<Key extends string, Value = unknown>(
		key: Exclude<Key, keyof ElectronStore>,
		defaultValue?: Value | undefined,
	): Value;

	get<Key extends string, Value = unknown>(
		key: Key,
		defaultValue?: unknown,
	): Value | Promise<Value | null> {
		// TODO(afr): Maybe improve this
		// @ts-expect-error
		return this.store.get(key, defaultValue);
	}

	async reset<Key extends keyof ElectronStore>(...keys: Key[]): Promise<void> {
		this.store.reset(...keys);
	}

	async set<Key extends keyof ElectronStore>(key: Key, value?: ElectronStore[Key] | undefined): Promise<void> {
		this.store.set(key, value);
	}

	async has<Key extends keyof ElectronStore>(key: string | Key): Promise<boolean> {
		return this.store.has(key);
	}
}
