/* eslint-disable max-len */
/* eslint-disable no-dupe-class-members */

import StorageProviderBase, { GenericStore } from '@beak/common-host/providers/storage';
import ElectronStore from 'electron-store';

interface Store extends ElectronStore<GenericStore> {
	get<Key extends keyof GenericStore, Value = unknown>(key: Key, defaultValue?: unknown): Value | null;
	reset<Key extends keyof GenericStore>(...keys: Key[]): void;
	set<Key extends keyof GenericStore>(key: Key, value?: GenericStore[Key]): void;
	has<Key extends keyof GenericStore>(key: Key | string): boolean;
}

export default class StorageProvider extends StorageProviderBase<GenericStore> {
	private readonly store: Store;

	constructor(defaults: GenericStore) {
		super(defaults);

		this.store = new ElectronStore<GenericStore>({
			defaults: this.defaults,
		}) as Store; // hack... electron-store typings are wrong
	}

	get<Key extends keyof GenericStore, Value = unknown>(
		key: Key,
		defaultValue?: unknown,
	): Value | null | Promise<Value | null> {
		return this.store.get(key, defaultValue);
	}

	async reset<Key extends keyof GenericStore>(...keys: Key[]): Promise<void> {
		this.store.reset(...keys);
	}

	async set<Key extends keyof GenericStore>(key: Key, value?: GenericStore[Key] | undefined): Promise<void> {
		this.store.set(key, value);
	}

	async has<Key extends keyof GenericStore>(key: string | Key): Promise<boolean> {
		return this.store.has(key);
	}
}
