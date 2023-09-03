/* eslint-disable max-len */
/* eslint-disable no-dupe-class-members */

import StorageProviderBase, { GenericStore } from '@beak/common-host/providers/storage';
import PersistentStore from 'electron-store';

export default class StorageProvider extends StorageProviderBase<GenericStore> {
	private readonly store: PersistentStore<GenericStore>;

	constructor(defaults: GenericStore) {
		super(defaults);

		this.store = new PersistentStore<GenericStore>({
			defaults: this.defaults,
		});
	}

	get<Key extends keyof GenericStore, Value = unknown>(
		key: Key,
		defaultValue?: unknown,
	): Value | Promise<Value | null> {
		// @ts-expect-error
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
