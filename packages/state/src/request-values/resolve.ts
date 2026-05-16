import type {
	Entries,
	EntryMap,
	NamedBooleanEntry,
	NamedNullEntry,
	NamedNumberEntry,
	NamedStringEntry,
} from '@getbeak/types/body-editor-json';
import type { RequestBody, RequestOverview, ToggleKeyValue } from '@getbeak/types/request';
import type { ValueSections } from '@getbeak/types/values';

import type { PropertyValue, PropertyValueMap, RequestValues } from '../schemas/request-values';

/**
 * Overlay the values slice onto a legacy `RequestOverview`.
 *
 * Today the slice mirrors the legacy tree (backfilled on project open),
 * so this is a no-op in practice — every property id resolves to the
 * same value either way. The function exists so flight prep can stop
 * caring whether values live in the tree or the slice: when editor
 * actions start writing through the slice (planned), prepare-request
 * sees the new values without touching the tree.
 *
 * URL / verb / options always come from the legacy tree — they're not
 * part of the schema/values split.
 */
export function resolveLegacyWithValues(
	overview: RequestOverview,
	values: RequestValues | null,
): RequestOverview {
	if (!values) return overview;

	return {
		verb: overview.verb,
		url: overview.url,
		options: overview.options,
		headers: overlayScalarMap(overview.headers, values.headers),
		query: overlayScalarMap(overview.query, values.query),
		body: overlayBody(overview.body, values),
	};
}

function overlayScalarMap(
	legacy: Record<string, ToggleKeyValue>,
	overlay: PropertyValueMap,
): Record<string, ToggleKeyValue> {
	const out: Record<string, ToggleKeyValue> = {};
	for (const [id, entry] of Object.entries(legacy)) {
		const cell = overlay[id];
		out[id] = applyScalarOverlay(entry, cell);
	}
	return out;
}

function applyScalarOverlay(entry: ToggleKeyValue, cell: PropertyValue | undefined): ToggleKeyValue {
	if (!cell) return entry;
	if (cell.kind !== 'string' && cell.kind !== 'number') return entry;
	return {
		...entry,
		value: cell.value as ValueSections,
		enabled: cell.enabled,
	};
}

function overlayBody(legacy: RequestBody, values: RequestValues): RequestBody {
	const bodyValues = values.body;
	if (bodyValues.type === 'none') return legacy;
	if (bodyValues.type !== legacy.type) return legacy;

	switch (legacy.type) {
		case 'text':
			return bodyValues.type === 'text' ? { ...legacy, payload: bodyValues.payload } : legacy;
		case 'json_raw':
			return bodyValues.type === 'json_raw' ? { ...legacy, payload: bodyValues.payload } : legacy;
		case 'json':
			return bodyValues.type === 'json'
				? { ...legacy, payload: overlayJsonEntries(legacy.payload, bodyValues.values) }
				: legacy;
		case 'url_encoded_form':
			return bodyValues.type === 'url_encoded_form'
				? { ...legacy, payload: overlayScalarMap(legacy.payload, bodyValues.values) }
				: legacy;
		case 'graphql':
			return bodyValues.type === 'graphql'
				? {
						...legacy,
						payload: {
							query: bodyValues.query ?? legacy.payload.query,
							variables: overlayJsonEntries(legacy.payload.variables, bodyValues.variables),
						},
					}
				: legacy;
		case 'file':
			// File body's bytes don't live in the values slice (the legacy
			// payload already references content-addressed assets).
			return legacy;
		case 'grpc':
			return bodyValues.type === 'grpc'
				? {
						...legacy,
						payload: {
							service: bodyValues.service || legacy.payload.service,
							method: bodyValues.method || legacy.payload.method,
							requestJson: bodyValues.requestJson,
						},
					}
				: legacy;
	}
}

function overlayJsonEntries(legacy: EntryMap, overlay: PropertyValueMap): EntryMap {
	const out: EntryMap = {};
	for (const [id, entry] of Object.entries(legacy)) {
		const cell = overlay[id];
		out[id] = applyJsonOverlay(entry, cell);
	}
	return out;
}

function applyJsonOverlay(entry: Entries, cell: PropertyValue | undefined): Entries {
	if (!cell) return entry;
	switch (entry.type) {
		case 'string':
		case 'enum':
			if (cell.kind !== 'string') return entry;
			return { ...(entry as NamedStringEntry), value: cell.value as ValueSections, enabled: cell.enabled };
		case 'number':
			if (cell.kind !== 'number') return entry;
			return { ...(entry as NamedNumberEntry), value: cell.value as ValueSections, enabled: cell.enabled };
		case 'boolean':
			if (cell.kind !== 'boolean') return entry;
			return { ...(entry as NamedBooleanEntry), value: cell.value, enabled: cell.enabled };
		case 'null':
			if (cell.kind !== 'null') return entry;
			return { ...(entry as NamedNullEntry), enabled: cell.enabled };
		case 'array':
		case 'object':
			// Containers don't carry values — pass through.
			return entry;
	}
}
