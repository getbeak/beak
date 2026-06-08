// ---------------------------------------------------------------------------
// Pure record helpers for the variable-sets domain (ADR 0005 §4)
// ---------------------------------------------------------------------------

/**
 * JS preserves insertion order for non-numeric string keys. To reorder a
 * Record we rebuild it with the keys in the new order. ksuid keys are
 * non-numeric so this is safe.
 */
export function reorderRecord<T>(record: Record<string, T>, key: string, toIndex: number): Record<string, T> {
	const keys = Object.keys(record);
	const from = keys.indexOf(key);
	if (from === -1) return record;
	const clamped = Math.max(0, Math.min(toIndex, keys.length - 1));
	if (from === clamped) return record;
	keys.splice(from, 1);
	keys.splice(clamped, 0, key);
	const next: Record<string, T> = {};
	for (const k of keys) next[k] = record[k];
	return next;
}

/**
 * Insert `newKey` immediately after `afterKey` in a Record, preserving
 * insertion order. When `afterKey` is not present the entry is appended.
 */
export function insertKeyAfter<T>(record: Record<string, T>, afterKey: string, newKey: string, value: T): Record<string, T> {
	const keys = Object.keys(record);
	const at = keys.indexOf(afterKey);
	const next: Record<string, T> = {};
	if (at === -1) {
		for (const k of keys) next[k] = record[k];
		next[newKey] = value;
		return next;
	}
	for (let i = 0; i < keys.length; i++) {
		next[keys[i]] = record[keys[i]];
		if (i === at) next[newKey] = value;
	}
	return next;
}

/**
 * Return `base` if it is not already in `taken`, otherwise append an
 * incrementing suffix (" 2", " 3", …). Falls back to `base <now>` if all
 * suffixes up to 999 are taken.
 */
export function uniqueName(base: string, taken: string[], now: number): string {
	if (!taken.includes(base)) return base;
	for (let i = 2; i < 1000; i++) {
		const candidate = `${base} ${i}`;
		if (!taken.includes(candidate)) return candidate;
	}
	return `${base} ${now}`;
}
