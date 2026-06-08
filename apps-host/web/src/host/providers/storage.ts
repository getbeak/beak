// TODO(afr): This is temporary, move to a better library in future

import StorageProviderBase, { type GenericStore } from '@beak/runtime-shared/ports/storage';

const keyPrefix = 'app.getbeak.beak.preferences';

/**
 * Web port of the runtime-shared StorageProvider, backed by `localStorage`.
 *
 * Dotted keys (`'notifications.onFailedRequest'`) are read from and written to
 * the *root* compound (`'notifications'`), matching `electron-store`'s
 * semantics — otherwise `set('notifications.foo', x)` would create a
 * standalone localStorage entry that `get('notifications')` never sees and the
 * preferences UI would silently fail to persist anything.
 *
 * Reads always fall back to the declared `defaults` (passed into the base
 * class) so a virgin localStorage returns sensible values instead of `null`.
 */
export default class StorageProvider extends StorageProviderBase<GenericStore> {
	get<Key extends keyof GenericStore>(key: Key): Promise<GenericStore[Key] | null>;
	get<Key extends keyof GenericStore>(key: Key, defaultValue: Required<GenericStore>[Key]): Promise<GenericStore[Key]>;
	get<Key extends string, Value = unknown>(
		key: Exclude<Key, keyof GenericStore>,
		defaultValue?: Value | undefined,
	): Value;

	get<Key extends string, Value = unknown>(key: Key, defaultValue?: unknown): Value | Promise<Value | null> {
		const [rootKey, ...rest] = key.split('.');
		const stored = readLocalStorage(rootKey!);
		const fromStorage = rest.length === 0 ? stored : resolvePath(stored, rest);

		if (fromStorage !== undefined && fromStorage !== null) return fromStorage as Value;
		if (defaultValue !== undefined) return defaultValue as Value;

		const fromDefaults =
			rest.length === 0
				? (this.defaults as unknown as Record<string, unknown>)[rootKey!]
				: resolvePath((this.defaults as unknown as Record<string, unknown>)[rootKey!], rest);

		return (fromDefaults ?? null) as Value;
	}

	async reset<Key extends keyof GenericStore>(..._keys: Key[]): Promise<void> {
		localStorage.clear();
	}

	async set<Key extends keyof GenericStore>(key: Key, value?: GenericStore[Key] | undefined): Promise<void>;
	async set(key: string, value: unknown): Promise<void>;
	async set(key: string, value: unknown): Promise<void> {
		const [rootKey, ...rest] = key.split('.');

		if (rest.length === 0) {
			writeLocalStorage(rootKey!, value);
			return;
		}

		// Dotted key — merge into the parent compound so reads of the root return
		// the latest sub-value.
		const current = readLocalStorage(rootKey!) ?? (this.defaults as unknown as Record<string, unknown>)[rootKey!] ?? {};
		const next = setPath(current, rest, value);
		writeLocalStorage(rootKey!, next);
	}

	async has<Key extends keyof GenericStore>(key: string | Key): Promise<boolean> {
		const [rootKey, ...rest] = String(key).split('.');
		const stored = readLocalStorage(rootKey!);
		if (rest.length === 0) return stored !== undefined && stored !== null;
		return resolvePath(stored, rest) !== undefined;
	}
}

function readLocalStorage(rootKey: string): unknown {
	const raw = localStorage.getItem([keyPrefix, rootKey].join('.'));
	return raw === null ? undefined : JSON.parse(raw);
}

function writeLocalStorage(rootKey: string, value: unknown): void {
	localStorage.setItem([keyPrefix, rootKey].join('.'), JSON.stringify(value));
}

function resolvePath(root: unknown, path: string[]): unknown {
	let cursor: unknown = root;
	for (const segment of path) {
		if (cursor === null || typeof cursor !== 'object') return undefined;
		cursor = (cursor as Record<string, unknown>)[segment];
	}
	return cursor;
}

function setPath(root: unknown, path: string[], value: unknown): Record<string, unknown> {
	const base: Record<string, unknown> =
		root !== null && typeof root === 'object' ? { ...(root as Record<string, unknown>) } : {};

	let cursor: Record<string, unknown> = base;
	for (let i = 0; i < path.length - 1; i++) {
		const segment = path[i]!;
		const existing = cursor[segment];
		const next: Record<string, unknown> =
			existing !== null && typeof existing === 'object' ? { ...(existing as Record<string, unknown>) } : {};
		cursor[segment] = next;
		cursor = next;
	}
	cursor[path[path.length - 1]!] = value;

	return base;
}
