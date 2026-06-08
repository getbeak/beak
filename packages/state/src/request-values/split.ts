import type { Entries, EntryMap } from '@getbeak/types/body-editor-json';
import type { RequestBody, RequestOverview, ToggleKeyValue } from '@getbeak/types/request';
import type { ValueSections } from '@getbeak/types/values';

import type { BodySchema, JsonProperty, JsonPropertyMap, RequestSchema } from '../schemas/request-schema';
import type { BodyValue, PropertyValue, PropertyValueMap, RequestValues } from '../schemas/request-values';

/**
 * Split a legacy `RequestOverview`-shaped request (where structural metadata
 * and concrete values are intermingled — every header has a `name` AND a
 * `value`, every JSON body entry has a `type` AND a `value`) into two
 * orthogonal pieces:
 *
 *   - `RequestSchema` — the structural contract (names, types, tree shape).
 *     Future: persisted in the request file. Today: derived on demand.
 *   - `RequestValues` — the concrete values, keyed by the schema entry id.
 *     Persisted per-project in `.beak/values.json`.
 *
 * Pure function: round-trip clean (merge back to the original `RequestOverview`)
 * for every legacy body type. The schema's per-property `id` mirrors the
 * legacy entry's `id` so existing UI state (selection, drag-and-drop, etc.)
 * keeps working without re-keying.
 */

export interface SplitResult {
	schema: RequestSchema;
	values: RequestValues;
}

export function splitRequestIntoSchemaAndValues(request: RequestOverview): SplitResult {
	const { headers: headerSchema, headerValues } = splitScalarMap(request.headers);
	const { headers: querySchema, headerValues: queryValues } = splitScalarMap(request.query);
	const { schema: bodySchema, values: bodyValues } = splitBody(request.body);

	return {
		schema: {
			headers: headerSchema,
			query: querySchema,
			body: bodySchema,
		},
		values: {
			headers: headerValues,
			query: queryValues,
			body: bodyValues,
		},
	};
}

/**
 * Inverse of `splitRequestIntoSchemaAndValues`. Given a schema + values pair
 * plus the request's identifying fields (verb/url/options), reconstruct a
 * `RequestOverview` that flight prep + the legacy writer can consume.
 */
export function mergeSchemaAndValues(
	identity: Pick<RequestOverview, 'verb' | 'url' | 'options'>,
	schema: RequestSchema,
	values: RequestValues,
): Omit<RequestOverview, 'body'> & { body: RequestOverview['body'] | undefined } {
	return {
		verb: identity.verb,
		url: identity.url,
		options: identity.options,
		headers: mergeScalarMap(schema.headers, values.headers),
		query: mergeScalarMap(schema.query, values.query),
		body: mergeBody(schema.body, values.body),
	};
}

// ─── Scalar (headers / query) ─────────────────────────────────────────────

function splitScalarMap(map: Record<string, ToggleKeyValue> | undefined): {
	headers: RequestSchema['headers'];
	headerValues: PropertyValueMap;
} {
	const headers: RequestSchema['headers'] = [];
	const headerValues: PropertyValueMap = {};
	if (!map) return { headers, headerValues };

	for (const [id, entry] of Object.entries(map)) {
		headers.push({
			id,
			name: entry.name,
			// The legacy ToggleKeyValue stores `type` as our scalar property type
			// (string | number | boolean | enum | token); the request-schema
			// shape uses the same union so this carries over directly.
			type: entry.type ?? 'string',
			...(entry.required === true ? { required: true } : {}),
			...(entry.description ? { description: entry.description } : {}),
		});
		headerValues[id] = {
			kind: 'string',
			value: entry.value,
			enabled: entry.enabled,
		};
	}

	return { headers, headerValues };
}

function mergeScalarMap(
	schemaList: RequestSchema['headers'],
	values: PropertyValueMap,
): Record<string, ToggleKeyValue> {
	const out: Record<string, ToggleKeyValue> = {};
	for (const def of schemaList) {
		const cell = values[def.id];
		out[def.id] = {
			name: def.name,
			value: extractValueSections(cell),
			enabled: cell ? cell.enabled : true,
			// Preserve schema metadata across the round-trip. The legacy
			// ToggleKeyValue shape carries these optionally, so we only emit
			// them when they're present in the schema.
			...(def.type !== 'string' ? { type: def.type } : {}),
			...(def.required === true ? { required: true } : {}),
			...(def.description ? { description: def.description } : {}),
		};
	}
	return out;
}

function extractValueSections(cell: PropertyValue | undefined): ValueSections {
	if (!cell) return [];
	if (cell.kind === 'string' || cell.kind === 'number') return cell.value as ValueSections;
	return [];
}

// ─── Body ─────────────────────────────────────────────────────────────────

function splitBody(body: RequestBody | undefined): { schema: BodySchema; values: BodyValue } {
	if (!body) return { schema: { type: 'none' }, values: { type: 'none' } };

	switch (body.type) {
		case 'text':
			return {
				schema: { type: 'text' },
				values: { type: 'text', payload: body.payload },
			};
		case 'json_raw':
			return {
				schema: { type: 'json_raw' },
				values: { type: 'json_raw', payload: body.payload },
			};
		case 'json': {
			const { properties, values } = splitJsonEntries(body.payload);
			return {
				schema: { type: 'json', properties },
				values: { type: 'json', values },
			};
		}
		case 'url_encoded_form': {
			const { headers, headerValues } = splitScalarMap(body.payload);
			return {
				schema: { type: 'url_encoded_form', fields: headers },
				values: { type: 'url_encoded_form', values: headerValues },
			};
		}
		case 'file': {
			const { fileReferenceId, contentType, assetRef } = body.payload;
			return {
				schema: { type: 'file' },
				values: {
					type: 'file',
					...(fileReferenceId ? { fileReferenceId } : {}),
					...(contentType ? { contentType } : {}),
					...(assetRef ? { assetRef } : {}),
				},
			};
		}
		case 'multipart': {
			// Multipart isn't yet decomposed into schema vs. values — the
			// parts list carries both metadata (kind / name structure /
			// contentType hints) and value-sections side by side. For now
			// the schema is a thin shell carrying part kind + content
			// types, and `values` keeps the full parts list verbatim.
			return {
				schema: {
					type: 'multipart',
					parts: body.payload.parts.map(p =>
						p.kind === 'text'
							? { kind: 'text', name: '', contentType: p.contentType }
							: { kind: 'binary', name: '', contentType: undefined },
					),
				},
				values: {
					type: 'multipart',
					...(body.payload.boundary ? { boundary: body.payload.boundary } : {}),
					parts: body.payload.parts,
				},
			};
		}
		case 'graphql': {
			const { properties, values } = splitJsonEntries(body.payload.variables);
			return {
				schema: { type: 'graphql', query: body.payload.query, variables: properties },
				values: {
					type: 'graphql',
					query: body.payload.query,
					variables: values,
				},
			};
		}
		case 'grpc':
			return {
				schema: { type: 'grpc', service: body.payload.service, method: body.payload.method },
				values: {
					type: 'grpc',
					service: body.payload.service,
					method: body.payload.method,
					requestJson: body.payload.requestJson,
				},
			};
	}
}

function mergeBody(schema: BodySchema, values: BodyValue): RequestBody | undefined {
	switch (schema.type) {
		case 'none':
			return undefined;
		case 'text':
			return { type: 'text', payload: values.type === 'text' ? values.payload : '' };
		case 'json_raw':
			return { type: 'json_raw', payload: values.type === 'json_raw' ? values.payload : '' };
		case 'json':
			return {
				type: 'json',
				payload: mergeJsonEntries(schema.properties, values.type === 'json' ? values.values : {}),
			};
		case 'url_encoded_form':
			return {
				type: 'url_encoded_form',
				payload: mergeScalarMap(schema.fields, values.type === 'url_encoded_form' ? values.values : {}),
			};
		case 'file': {
			if (values.type !== 'file') return { type: 'file', payload: {} };
			const { fileReferenceId, contentType, assetRef } = values;
			return {
				type: 'file',
				payload: {
					...(fileReferenceId ? { fileReferenceId } : {}),
					...(contentType ? { contentType } : {}),
					...(assetRef ? { assetRef } : {}),
				},
			};
		}
		case 'multipart': {
			if (values.type !== 'multipart') return { type: 'multipart', payload: { parts: [] } };
			return {
				type: 'multipart',
				payload: {
					...(values.boundary ? { boundary: values.boundary } : {}),
					// `parts` is round-tripped opaquely through the values
					// store; the editor manipulates the structured shape
					// directly on the request file's tree node rather than
					// through the split/merge dance the JSON / form bodies
					// use. Future polish: typed validation here.
					parts: (values.parts ?? []) as never,
				},
			};
		}
		case 'graphql':
			return {
				type: 'graphql',
				payload: {
					query: values.type === 'graphql' ? values.query : schema.query,
					variables: mergeJsonEntries(schema.variables, values.type === 'graphql' ? values.variables : {}),
				},
			};
		case 'grpc':
			return {
				type: 'grpc',
				payload: {
					service: schema.service,
					method: schema.method,
					// `requestJson` lives only on the values side — when the user
					// hasn't touched it yet we default to an empty object so the
					// editor lands on something parseable rather than a blank file.
					requestJson: values.type === 'grpc' ? values.requestJson : '{}',
				},
			};
	}
}

// ─── JSON body / GraphQL variables ────────────────────────────────────────
//
// JSON entries already split cleanly: every entry carries (id, parentId,
// name, enabled, type, value). The first five become the schema property;
// the value goes to the values store.

function splitJsonEntries(entries: EntryMap | undefined): { properties: JsonPropertyMap; values: PropertyValueMap } {
	const properties: JsonPropertyMap = {};
	const values: PropertyValueMap = {};
	if (!entries) return { properties, values };

	for (const [id, entry] of Object.entries(entries)) {
		properties[id] = entryToProperty(id, entry);
		const valueCell = entryToValueCell(entry);
		if (valueCell) values[id] = valueCell;
	}

	return { properties, values };
}

function entryToProperty(id: string, entry: Entries): JsonProperty {
	const base = {
		id,
		parentId: entry.parentId,
		...('name' in entry && typeof entry.name === 'string' ? { name: entry.name } : {}),
		...(entry.required === true ? { required: true } : {}),
		...(entry.description ? { description: entry.description } : {}),
	};

	switch (entry.type) {
		case 'string':
			return { ...base, type: 'string' };
		case 'number':
			return { ...base, type: 'number' };
		case 'boolean':
			return { ...base, type: 'boolean' };
		case 'null':
			return { ...base, type: 'null' };
		case 'enum':
			// Enum carries a constraints.enum list on the schema side so the
			// json-property model stays a closed set — the editor reads it back
			// through `constraints.enum` rather than a top-level `options`.
			return {
				...base,
				type: 'string',
				...(entry.options && entry.options.length > 0 ? { constraints: { enum: entry.options } } : {}),
			};
		case 'array':
			return { ...base, type: 'array' };
		case 'object':
			return { ...base, type: 'object' };
	}
}

function entryToValueCell(entry: Entries): PropertyValue | null {
	switch (entry.type) {
		case 'string':
		case 'enum':
			return { kind: 'string', value: entry.value, enabled: entry.enabled } as PropertyValue;
		case 'number':
			return { kind: 'number', value: entry.value, enabled: entry.enabled } as PropertyValue;
		case 'boolean':
			return { kind: 'boolean', value: entry.value, enabled: entry.enabled };
		case 'null':
			return { kind: 'null', enabled: entry.enabled };
		case 'array':
		case 'object':
			// Containers carry no value cell — the structure is the schema.
			return null;
	}
}

function mergeJsonEntries(properties: JsonPropertyMap, values: PropertyValueMap): EntryMap {
	const out: EntryMap = {};
	for (const [id, prop] of Object.entries(properties)) {
		const cell = values[id];
		out[id] = propertyToEntry(prop, cell);
	}
	return out;
}

function propertyToEntry(prop: JsonProperty, cell: PropertyValue | undefined): Entries {
	const base = {
		id: prop.id,
		parentId: prop.parentId,
		enabled: cell ? cell.enabled : true,
		...(prop.name !== undefined ? { name: prop.name } : {}),
		...(prop.required === true ? { required: true } : {}),
		...(prop.description ? { description: prop.description } : {}),
	};

	switch (prop.type) {
		case 'string':
			return {
				...base,
				type: 'string',
				value: cell && cell.kind === 'string' ? cell.value : [],
			} as Entries;
		case 'number':
			return {
				...base,
				type: 'number',
				value: cell && cell.kind === 'number' ? cell.value : [],
			} as Entries;
		case 'boolean':
			return {
				...base,
				type: 'boolean',
				value: cell && cell.kind === 'boolean' ? cell.value : false,
			} as Entries;
		case 'null':
			return { ...base, type: 'null', value: null } as Entries;
		case 'array':
			return { ...base, type: 'array' } as Entries;
		case 'object':
			return { ...base, type: 'object' } as Entries;
	}
}
