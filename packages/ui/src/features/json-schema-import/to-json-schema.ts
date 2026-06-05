import { TypedObject } from '@beak/common/helpers/typescript';
import type { Entries, EntryMap, NamedEntries } from '@getbeak/types/body-editor-json';
import type { ValueSections } from '@getbeak/types/values';

/**
 * Pure `EntryMap` → JSON Schema (Draft 2020-12) converter — the inverse of
 * `converter.ts`. We emit a real JSON Schema document so the renderer can:
 *
 *   1. Feed it to Monaco's JSON language service for live validation in the
 *      `json_raw` editor.
 *   2. Copy it to the clipboard / paste into OpenAPI specs without touching
 *      a separate tool.
 *
 * The conversion is structural, not "infer-from-values" — we trust the
 * schema metadata the user authored (`type`, `required`, `description`,
 * `options`) and treat the entry's `value` field only as a default seed for
 * primitives. Containers ignore values entirely (they have no value field
 * by design).
 *
 * Out of scope:
 *  - `$ref` emission. We inline every subtree — workflow / OpenAPI consumers
 *    that need refs can post-process.
 *  - Format / pattern / min / max constraints. Beak's schema model doesn't
 *    carry these today; when it does, extend `mapLeafConstraints` below.
 */

/**
 * Minimal Draft 2020-12 subset we emit. Plain `object` so consumers can
 * widen it without a type cast — JSON Schema is structurally typed and
 * Beak's emit set is a strict subset of what tools accept.
 */
export type JsonSchemaDoc = {
	$schema?: string;
	type?: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';
	description?: string;
	properties?: Record<string, JsonSchemaDoc>;
	required?: string[];
	items?: JsonSchemaDoc;
	enum?: unknown[];
	default?: unknown;
};

export interface EntryMapToJsonSchemaOptions {
	/**
	 * Include the `$schema` declaration at the root so the document is
	 * self-identifying. Off by default — most consumers (Monaco, OpenAPI)
	 * don't need it and it just adds noise.
	 */
	includeSchemaDialect?: boolean;
	/**
	 * Mark the root container as `additionalProperties: false` so JSON Schema
	 * validators reject unknown keys. Defaults to `false` — Beak treats its
	 * tree as "the fields we care about" rather than "the only fields
	 * allowed", which matches how most APIs evolve.
	 */
	strict?: boolean;
}

/**
 * Convert the Beak `EntryMap` rooted at a sole `parentId === null` entry
 * into a JSON Schema document. Returns `null` when the tree is empty (no
 * entries — there's nothing to describe).
 */
export function entryMapToJsonSchema(
	entries: EntryMap,
	options: EntryMapToJsonSchemaOptions = {},
): JsonSchemaDoc | null {
	const root = TypedObject.values(entries).find(e => e.parentId === null);
	if (!root) return null;

	const childrenByParent = indexChildrenByParent(entries);
	const schema = buildSchema(root, childrenByParent, options);

	if (options.includeSchemaDialect) {
		schema.$schema = 'https://json-schema.org/draft/2020-12/schema';
	}
	return schema;
}

function indexChildrenByParent(entries: EntryMap): Map<string, Entries[]> {
	const map = new Map<string, Entries[]>();
	for (const entry of TypedObject.values(entries)) {
		if (!entry.parentId) continue;
		const bucket = map.get(entry.parentId);
		if (bucket) bucket.push(entry);
		else map.set(entry.parentId, [entry]);
	}
	return map;
}

function buildSchema(
	entry: Entries,
	childrenByParent: Map<string, Entries[]>,
	options: EntryMapToJsonSchemaOptions,
): JsonSchemaDoc {
	const schema: JsonSchemaDoc = {};
	if (entry.description) schema.description = entry.description;

	switch (entry.type) {
		case 'string': {
			schema.type = 'string';
			const seed = readStringSeed(entry.value);
			if (seed !== undefined) schema.default = seed;
			return schema;
		}
		case 'number': {
			schema.type = 'number';
			const seed = readNumberSeed(entry.value);
			if (seed !== undefined) schema.default = seed;
			return schema;
		}
		case 'boolean': {
			schema.type = 'boolean';
			if (typeof entry.value === 'boolean') schema.default = entry.value;
			return schema;
		}
		case 'null': {
			schema.type = 'null';
			return schema;
		}
		case 'enum': {
			// Enum lives without a `type` keyword in our emit — the option set
			// is the constraint. Adding `type: 'string'` would lock the values
			// to strings, but our options carry whatever the user typed.
			if (Array.isArray(entry.options) && entry.options.length > 0) {
				schema.enum = [...entry.options];
			}
			const seed = readStringSeed(entry.value);
			if (seed !== undefined) schema.default = seed;
			return schema;
		}
		case 'object': {
			schema.type = 'object';
			const children = childrenByParent.get(entry.id) ?? [];
			if (children.length > 0) {
				const properties: Record<string, JsonSchemaDoc> = {};
				const required: string[] = [];
				for (const child of children) {
					const namedChild = child as NamedEntries;
					if (typeof namedChild.name !== 'string' || namedChild.name.length === 0) {
						// Empty-named children are dropped at prepare-request time;
						// mirror that here so the emitted schema matches the wire shape.
						continue;
					}
					if (child.enabled === false) continue;
					properties[namedChild.name] = buildSchema(child, childrenByParent, options);
					if (child.required === true) required.push(namedChild.name);
				}
				if (Object.keys(properties).length > 0) schema.properties = properties;
				if (required.length > 0) schema.required = required;
			}
			if (options.strict && (schema.properties || true)) {
				// `additionalProperties: false` lives outside our typed surface
				// (we keep the type narrow). Cast through a record write — the
				// schema doc itself is just JSON.
				(schema as Record<string, unknown>).additionalProperties = false;
			}
			return schema;
		}
		case 'array': {
			schema.type = 'array';
			const children = childrenByParent.get(entry.id) ?? [];
			// Array entries describe their items via children. We take the
			// first enabled child as the items schema — matches how the
			// inverse converter seeds a single child from `items[0]`. Multiple
			// children would suggest tuple-style typing; defer that until
			// Beak's editor supports it visually.
			const itemTemplate = children.find(c => c.enabled !== false);
			if (itemTemplate) schema.items = buildSchema(itemTemplate, childrenByParent, options);
			return schema;
		}
	}
	return schema;
}

/**
 * Read a string-shaped seed from a ValueSections array. We only emit a
 * default when the user has authored a literal — variable references
 * resolve at flight time, so they don't belong in a static schema doc.
 */
function readStringSeed(value: ValueSections): string | undefined {
	if (!Array.isArray(value) || value.length === 0) return undefined;
	if (value.length === 1 && typeof value[0] === 'string') {
		return value[0].length > 0 ? value[0] : undefined;
	}
	// Mixed parts (literal + variable) — skip the default rather than emit a
	// half-resolved string.
	return undefined;
}

function readNumberSeed(value: ValueSections): number | undefined {
	const text = readStringSeed(value);
	if (text === undefined) return undefined;
	const parsed = Number(text);
	return Number.isFinite(parsed) ? parsed : undefined;
}
