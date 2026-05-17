import type { EntryMap } from '@getbeak/types/body-editor-json';
import type { ToggleKeyValue } from '@getbeak/types/request';
import type { ValueSections } from '@getbeak/types/values';

import type { OverrideEntry, RequestOverrides } from './types';

/**
 * Pure merge + prune helpers for workflow request-node overrides.
 *
 * Workflow steps don't own their request — they link to one in the project
 * tree and patch it with a per-step override map. The view-model is the
 * linked request's fields with the override slots applied; the on-disk
 * shape is the override map alone (so re-running the workflow against a
 * mutated linked request picks up the new schema for free).
 *
 * These helpers were inline in `NodePropertiesPanel.tsx` (950 LOC) — pure
 * Plain Old TypeScript with no React or Redux, but lived in a renderer
 * file. Extracted so the rules are testable without mounting the panel,
 * and so the next "what does pruning consider empty?" tweak edits one
 * file, not five.
 */

/**
 * Merge a header / query map (keyed by stable id) with the workflow's
 * per-row override slots. Untouched slots pass through; slots that set
 * `value` or `enabled` overwrite the corresponding fields. Other fields
 * (schema metadata, required, description) stay from the linked request.
 */
export function mergeKv(
	linked: Record<string, ToggleKeyValue>,
	overrides: Record<string, OverrideEntry> | undefined,
): Record<string, ToggleKeyValue> {
	if (!overrides) return linked;
	const out: Record<string, ToggleKeyValue> = {};
	for (const [id, base] of Object.entries(linked)) {
		const o = overrides[id];
		if (!o || (o.value === undefined && o.enabled === undefined)) {
			out[id] = base;
			continue;
		}
		out[id] = {
			...base,
			...(o.value !== undefined ? { value: o.value as ValueSections } : {}),
			...(o.enabled !== undefined ? { enabled: o.enabled } : {}),
		};
	}
	return out;
}

/**
 * Merge a JSON entry-map with the workflow's per-entry override slots.
 * Same shape rules as `mergeKv` — the override carries `value` and
 * `enabled`; everything else stays from the linked entry. Type-cast
 * through `never` because `Entries` is a discriminated union and each
 * variant's `value` has a different shape — the editor enforces that
 * the user can only author the variant the linked entry already is.
 */
export function mergeJson(linked: EntryMap, overrides: Record<string, OverrideEntry> | undefined): EntryMap {
	if (!overrides) return linked;
	const out: EntryMap = {};
	for (const [id, base] of Object.entries(linked)) {
		const o = overrides[id];
		if (!o || (o.value === undefined && o.enabled === undefined)) {
			out[id] = base;
			continue;
		}
		out[id] = {
			...base,
			...(o.value !== undefined ? { value: o.value as never } : {}),
			...(o.enabled !== undefined ? { enabled: o.enabled } : {}),
		} as EntryMap[string];
	}
	return out;
}

/**
 * Strip override slots that have neither a `value` nor an `enabled` set.
 * They're effectively pass-throughs and shouldn't bloat the on-disk file.
 * Returns `undefined` when the map empties out entirely so the parent
 * pruning step can collapse the containing field.
 */
export function pruneOverrideMap(map: Record<string, OverrideEntry>): Record<string, OverrideEntry> | undefined {
	const out: Record<string, OverrideEntry> = {};
	for (const [id, entry] of Object.entries(map)) {
		if (entry.value === undefined && entry.enabled === undefined) continue;
		out[id] = entry;
	}
	return Object.keys(out).length === 0 ? undefined : out;
}

/**
 * Collapse an empty body-override block. `fields` empties when every
 * slot was pruned; `raw` empties when both content-type and text are
 * absent. Returns `undefined` when both halves are empty so the parent
 * `pruneOverrides` strips the field entirely.
 */
export function pruneBody(
	body: NonNullable<RequestOverrides['body']>,
): NonNullable<RequestOverrides['body']> | undefined {
	const fields = body.fields;
	const raw = body.raw;
	const rawEmpty = !raw || (!raw.contentType && (!raw.text || raw.text.length === 0));
	const fieldsEmpty = !fields || Object.keys(fields).length === 0;
	if (fieldsEmpty && rawEmpty) return undefined;
	const out: NonNullable<RequestOverrides['body']> = {};
	if (!fieldsEmpty) out.fields = fields;
	if (!rawEmpty) out.raw = raw;
	return out;
}

/**
 * Drop empty containers off the top-level overrides object so the
 * workflow file persists only the slots the user actually touched.
 * Returns `undefined` when the user has touched nothing — the reducer
 * uses that to clear the node's `overrides` field entirely.
 */
export function pruneOverrides(overrides: RequestOverrides): RequestOverrides | undefined {
	const out: RequestOverrides = {};
	if (overrides.headers && Object.keys(overrides.headers).length > 0) out.headers = overrides.headers;
	if (overrides.query && Object.keys(overrides.query).length > 0) out.query = overrides.query;
	if (overrides.body) out.body = overrides.body;
	if (overrides.fragment && overrides.fragment.length > 0) out.fragment = overrides.fragment;
	return Object.keys(out).length === 0 ? undefined : out;
}
