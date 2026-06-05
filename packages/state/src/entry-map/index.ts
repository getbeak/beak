import type { Entries, EntryMap } from '@getbeak/types/body-editor-json';

/**
 * Pure helpers for walking the structured JSON entry-map — the flat
 * parent-pointer tree the JSON body editor stores rows in.
 *
 * Multiple files used to hand-roll the same patterns:
 *   `Object.values(entries).find(e => e.parentId === null)` (root)
 *   `Object.values(entries).filter(e => e.parentId === id && e.enabled)` (children)
 *   `Object.values(entries).filter(e => e.required && !e.enabled === false)` (counts)
 *
 * One file forgot the `.enabled` check on the root (`JsonEditor.findRoot`) —
 * the kind of drift that concentrating the logic here prevents.
 */

/**
 * Locate the root entry — the one with `parentId === null`. Skips
 * disabled roots: returns `undefined` if the root is toggled off, the
 * same way `convertToRealJson` already treats a disabled root as "no
 * payload". Callers that need the structural root regardless of
 * `enabled` should iterate `Object.values(entries)` themselves.
 */
export function findRoot(entries: EntryMap): Entries | undefined {
	for (const entry of Object.values(entries)) {
		if (entry.parentId === null && entry.enabled) return entry;
	}
	return undefined;
}

/**
 * Locate the structural root regardless of `enabled`. Useful for editor
 * affordances that need to render a disabled root (so the user can
 * re-enable it). For flight prep + value derivation, prefer `findRoot`.
 */
export function findRootIncludingDisabled(entries: EntryMap): Entries | undefined {
	for (const entry of Object.values(entries)) {
		if (entry.parentId === null) return entry;
	}
	return undefined;
}

/**
 * Return every direct child of `parentId`, enabled by default. Pass
 * `{ includeDisabled: true }` for the rare editor-side need to render
 * disabled rows.
 */
export function findChildren(
	entries: EntryMap,
	parentId: string,
	options: { includeDisabled?: boolean } = {},
): Entries[] {
	const out: Entries[] = [];
	for (const entry of Object.values(entries)) {
		if (entry.parentId !== parentId) continue;
		if (!options.includeDisabled && !entry.enabled) continue;
		out.push(entry);
	}
	return out;
}

/**
 * Walk every enabled entry in arbitrary order (currently insertion).
 * Mirrors `convertToRealJson`'s traversal but as a generic visitor for
 * counters / linters / search indexers.
 */
export function walkEnabled(entries: EntryMap, fn: (entry: Entries) => void): void {
	for (const entry of Object.values(entries)) {
		if (entry.enabled) fn(entry);
	}
}

/**
 * Count entries matching `predicate`. The default predicate counts
 * required-but-not-disabled entries — the pattern that drove the
 * red badge on the request pane's body tab. Pass your own predicate
 * for any other "how many entries are…" UI affordance.
 */
export function countWhere(entries: EntryMap, predicate: (entry: Entries) => boolean): number {
	let count = 0;
	for (const entry of Object.values(entries)) {
		if (predicate(entry)) count++;
	}
	return count;
}

/**
 * Container types satisfy the "filled in" contract by their presence —
 * an empty object is still a real value at flight time. Intrinsic
 * primitives (boolean, null) likewise: their `value` field carries a
 * concrete answer. Only string / number / enum entries are "empty"
 * when their value-parts array is effectively blank.
 *
 * The "effectively blank" check is delegated to the value-parts service
 * via a callback so this module stays decoupled from value-parts (and
 * the type-level dep order). Pass `valueParts.isEmpty` from the call
 * site.
 */
export function isEntryValueEmpty(
	entry: Entries | undefined,
	isValuePartsEmpty: (parts: Entries extends { value: infer V } ? V : never) => boolean,
): boolean {
	if (!entry) return true;
	if (entry.type === 'object' || entry.type === 'array') return false;
	if (entry.type === 'boolean' || entry.type === 'null') return false;
	// string / number / enum — value is a ValueSections; delegate to value-parts.
	return isValuePartsEmpty((entry as unknown as { value: never }).value);
}
