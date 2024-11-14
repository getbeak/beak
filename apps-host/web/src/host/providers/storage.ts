/* eslint-disable no-dupe-class-members */

// TODO(afr): This is temporary, move to a better library in future

import StorageProviderBase, { GenericStore } from '@beak/common-host/providers/storage';

const keyPrefix = 'app.getbeak.beak.preferences';

export default class StorageProvider extends StorageProviderBase<GenericStore> {
	get<Key extends keyof GenericStore>(key: Key): Promise<GenericStore[Key] | null>;
	get<Key extends keyof GenericStore>(
		key: Key,
		defaultValue: Required<GenericStore>[Key],
	): Promise<GenericStore[Key]>;
	get<Key extends string, Value = unknown>(
		key: Exclude<Key, keyof GenericStore>,
		defaultValue?: Value | undefined,
	): Value;

	get<Key extends string, Value = unknown>(
		key: Key,
		defaultValue?: unknown,
	): Value | Promise<Value | null> {
		const ret = localStorage.getItem([keyPrefix, key].join('.'));

		if (!ret) return defaultValue as Value;

		return JSON.parse(ret) as Value;
	}

	async reset<Key extends keyof GenericStore>(..._keys: Key[]): Promise<void> {
		localStorage.clear();
	}

	async set<Key extends keyof GenericStore>(key: Key, value?: GenericStore[Key] | undefined): Promise<void> {
		localStorage.setItem([keyPrefix, key].join('.'), JSON.stringify(value));
	}

	async has<Key extends keyof GenericStore>(key: string | Key): Promise<boolean> {
		return Boolean(localStorage.getItem([keyPrefix, key].join('.')));
	}
}
