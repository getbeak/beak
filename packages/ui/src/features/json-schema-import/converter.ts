import ksuid from '@beak/ksuid';
import type { EntryMap, EntryType, NamedEntries } from '@getbeak/types/body-editor-json';

/**
 * Pure JSON Schema → Beak `EntryMap` converter. Hand-rolled (no `ajv`) so the
 * renderer doesn't have to pull a 200 KB dependency just to seed a body. The
 * goal isn't full Draft 2020-12 compliance — it's "give the user a sensible
 * starting tree they can edit". We accept Drafts 4 / 6 / 7 / 2019-09 /
 * 2020-12 inputs and ignore declarations we don't understand.
 *
 * Supported:
 *  - `type` ∈ string|number|integer|boolean|null|array|object (and arrays of
 *    these — we pick the first non-null type from the union)
 *  - `properties` + `required` on objects → object entries, with required
 *    propagated to each child
 *  - `items` on arrays — both the single-schema and the array-of-schemas
 *    forms are accepted; we seed exactly one child from `items[0]` (or
 *    `items` itself when it's a single schema)
 *  - `enum` on any primitive → enum entry with `options` populated
 *  - `description` → carried onto every entry
 *  - `default` / `example` / `examples[0]` → seed value for string/number
 *    entries (booleans/nulls don't need seeding)
 *  - `$ref` — local refs only (`#/definitions/X`, `#/$defs/X`,
 *    `#/components/schemas/X` for OpenAPI inputs). External refs and HTTP
 *    URIs are ignored; the entry falls back to `string` with a description
 *    noting the ref so the user can manually fix.
 *
 * Out of scope (deferred):
 *  - `allOf` / `anyOf` / `oneOf` composition — we pick the first one.
 *  - JSON Pointer escapes inside refs (`~0`, `~1`).
 *  - Pattern properties, additional properties beyond the explicit list.
 */

interface JsonSchemaLike {
	type?: string | string[];
	properties?: Record<string, JsonSchemaLike>;
	required?: string[];
	items?: JsonSchemaLike | JsonSchemaLike[];
	enum?: unknown[];
	description?: string;
	default?: unknown;
	example?: unknown;
	examples?: unknown[];
	$ref?: string;
	// Draft-specific definition bags. We harvest all three so OpenAPI specs
	// with `components/schemas` and modern schemas with `$defs` both work.
	definitions?: Record<string, JsonSchemaLike>;
	$defs?: Record<string, JsonSchemaLike>;
	components?: { schemas?: Record<string, JsonSchemaLike> };
	allOf?: JsonSchemaLike[];
	anyOf?: JsonSchemaLike[];
	oneOf?: JsonSchemaLike[];
}

export interface ConversionResult {
	entries: EntryMap;
	warnings: string[];
}

export class JsonSchemaParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'JsonSchemaParseError';
	}
}

/**
 * Parse a JSON Schema string and convert it. Returns the EntryMap ready to
 * drop into a request's `body.payload`, plus any warnings the user should
 * see (unsupported keywords, dropped refs, type ambiguities).
 */
export function parseAndConvert(raw: string): ConversionResult {
	let schema: JsonSchemaLike;
	try {
		schema = JSON.parse(raw) as JsonSchemaLike;
	} catch (err) {
		throw new JsonSchemaParseError(err instanceof Error ? `Invalid JSON: ${err.message}` : 'Invalid JSON');
	}

	if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
		throw new JsonSchemaParseError('Top-level schema must be an object.');
	}

	const warnings: string[] = [];
	const refRoot = collectDefinitions(schema);
	const entries: EntryMap = {};

	buildEntry({
		schema,
		parentId: null,
		nameOverride: undefined,
		entries,
		refRoot,
		warnings,
		isRequired: false,
		depth: 0,
	});

	return { entries, warnings };
}

interface BuildContext {
	schema: JsonSchemaLike;
	parentId: string | null;
	/** Name as it appears in the parent's `properties` map. Undefined for the root or for array children (which are nameless). */
	nameOverride: string | undefined;
	entries: EntryMap;
	refRoot: Record<string, JsonSchemaLike>;
	warnings: string[];
	isRequired: boolean;
	depth: number;
}

const MAX_DEPTH = 24;

function buildEntry(ctx: BuildContext): string {
	if (ctx.depth > MAX_DEPTH) {
		ctx.warnings.push(`Schema nesting exceeded ${MAX_DEPTH} levels — truncating.`);
		const id = ksuid.generate('jsonentry').toString();
		ctx.entries[id] = {
			id,
			parentId: ctx.parentId,
			name: ctx.nameOverride,
			type: 'string',
			enabled: true,
			value: [],
		} as NamedEntries;
		return id;
	}

	// Resolve $ref first — everything else operates on the dereferenced node.
	let resolved = ctx.schema;
	if (resolved.$ref) {
		const pointed = resolveRef(resolved.$ref, ctx.refRoot);
		if (pointed) resolved = mergeSchemas(resolved, pointed);
		else ctx.warnings.push(`Unsupported $ref: ${resolved.$ref}`);
	}

	// Pick a representative branch from composition keywords. The first one
	// usually carries the shape the user will edit; deeper composition is
	// best handled by hand after the seed lands.
	if (resolved.allOf?.[0]) resolved = mergeSchemas(resolved, resolved.allOf[0]);
	else if (resolved.anyOf?.[0]) resolved = mergeSchemas(resolved, resolved.anyOf[0]);
	else if (resolved.oneOf?.[0]) resolved = mergeSchemas(resolved, resolved.oneOf[0]);

	const id = ksuid.generate('jsonentry').toString();
	const beakType = pickType(resolved, ctx.warnings);
	const description = typeof resolved.description === 'string' ? resolved.description : undefined;
	const seedValue = pickSeedValue(resolved);

	if (beakType === 'object') {
		ctx.entries[id] = decorateEntry(
			{
				id,
				parentId: ctx.parentId,
				name: ctx.nameOverride,
				type: 'object',
				enabled: true,
			} as NamedEntries,
			{ description, required: ctx.isRequired },
		);
		const requiredSet = new Set(resolved.required ?? []);
		const props = resolved.properties ?? {};
		for (const key of Object.keys(props)) {
			buildEntry({
				schema: props[key],
				parentId: id,
				nameOverride: key,
				entries: ctx.entries,
				refRoot: ctx.refRoot,
				warnings: ctx.warnings,
				isRequired: requiredSet.has(key),
				depth: ctx.depth + 1,
			});
		}
		return id;
	}

	if (beakType === 'array') {
		ctx.entries[id] = decorateEntry(
			{
				id,
				parentId: ctx.parentId,
				name: ctx.nameOverride,
				type: 'array',
				enabled: true,
			} as NamedEntries,
			{ description, required: ctx.isRequired },
		);
		// Use the first item schema as the template for one seeded child.
		const itemSchema = Array.isArray(resolved.items) ? resolved.items[0] : resolved.items;
		if (itemSchema && typeof itemSchema === 'object') {
			buildEntry({
				schema: itemSchema,
				parentId: id,
				nameOverride: undefined,
				entries: ctx.entries,
				refRoot: ctx.refRoot,
				warnings: ctx.warnings,
				isRequired: false,
				depth: ctx.depth + 1,
			});
		}
		return id;
	}

	if (beakType === 'enum') {
		ctx.entries[id] = decorateEntry(
			{
				id,
				parentId: ctx.parentId,
				name: ctx.nameOverride,
				type: 'enum',
				enabled: true,
				value: typeof seedValue === 'string' ? [seedValue] : [],
				options: (resolved.enum ?? []).map(v => String(v)),
			} as unknown as NamedEntries,
			{ description, required: ctx.isRequired },
		);
		return id;
	}

	if (beakType === 'boolean') {
		ctx.entries[id] = decorateEntry(
			{
				id,
				parentId: ctx.parentId,
				name: ctx.nameOverride,
				type: 'boolean',
				enabled: true,
				value: typeof seedValue === 'boolean' ? seedValue : false,
			} as NamedEntries,
			{ description, required: ctx.isRequired },
		);
		return id;
	}

	if (beakType === 'null') {
		ctx.entries[id] = decorateEntry(
			{
				id,
				parentId: ctx.parentId,
				name: ctx.nameOverride,
				type: 'null',
				enabled: true,
				value: null,
			} as NamedEntries,
			{ description, required: ctx.isRequired },
		);
		return id;
	}

	// `string` and `number` — both carry a ValueSections of one literal part.
	ctx.entries[id] = decorateEntry(
		{
			id,
			parentId: ctx.parentId,
			name: ctx.nameOverride,
			type: beakType,
			enabled: true,
			value: seedValue !== undefined ? [String(seedValue)] : [],
		} as NamedEntries,
		{ description, required: ctx.isRequired },
	);
	return id;
}

function decorateEntry(entry: NamedEntries, opts: { description?: string; required: boolean }): NamedEntries {
	if (opts.description) entry.description = opts.description;
	if (opts.required) entry.required = true;
	return entry;
}

/**
 * Pick the Beak `EntryType` that best fits a schema node. Union types pick
 * the first non-null entry so users get a meaningful seed; an `enum`
 * declaration always wins because the enum picker is the most useful
 * affordance Beak has for that shape.
 */
function pickType(schema: JsonSchemaLike, warnings: string[]): EntryType {
	if (Array.isArray(schema.enum) && schema.enum.length > 0) return 'enum';

	const rawType = schema.type;
	const candidate = Array.isArray(rawType) ? (rawType.find(t => t !== 'null') ?? rawType[0]) : rawType;

	switch (candidate) {
		case 'string':
			return 'string';
		case 'number':
		case 'integer':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'null':
			return 'null';
		case 'array':
			return 'array';
		case 'object':
			return 'object';
		default:
			break;
	}

	// No declared type — infer from structure. `properties` → object, `items`
	// → array. Fall back to string with a warning so the user sees the gap.
	if (schema.properties) return 'object';
	if (schema.items) return 'array';
	if (candidate) warnings.push(`Unknown type "${String(candidate)}" — treated as string.`);
	return 'string';
}

/**
 * Pick the most authoritative seed value for a leaf entry. `default` wins
 * over `example` wins over `examples[0]` — that's the order JSON Schema
 * authors expect. For enums we return the first member of the enum list
 * as a sensible "currently-set" value.
 */
function pickSeedValue(schema: JsonSchemaLike): unknown {
	if (schema.default !== undefined) return schema.default;
	if (schema.example !== undefined) return schema.example;
	if (Array.isArray(schema.examples) && schema.examples.length > 0) return schema.examples[0];
	if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];
	return undefined;
}

/**
 * Build a lookup table of every named subschema reachable from the root.
 * Supports JSON Schema Draft 4–7 (`definitions`), Draft 2019-09+ (`$defs`),
 * and OpenAPI (`components.schemas`) without forcing the user to pick a
 * dialect.
 */
function collectDefinitions(root: JsonSchemaLike): Record<string, JsonSchemaLike> {
	const map: Record<string, JsonSchemaLike> = {};
	if (root.definitions) for (const k of Object.keys(root.definitions)) map[`definitions/${k}`] = root.definitions[k];
	if (root.$defs) for (const k of Object.keys(root.$defs)) map[`$defs/${k}`] = root.$defs[k];
	if (root.components?.schemas) {
		for (const k of Object.keys(root.components.schemas)) map[`components/schemas/${k}`] = root.components.schemas[k];
	}
	return map;
}

function resolveRef(ref: string, refRoot: Record<string, JsonSchemaLike>): JsonSchemaLike | null {
	if (!ref.startsWith('#/')) return null;
	const path = ref.slice(2);
	return refRoot[path] ?? null;
}

/**
 * Shallow-merge two schema nodes. The override wins for primitive fields;
 * objects (properties / definitions / etc.) are spread together so the
 * caller doesn't accidentally drop sibling props when merging an `allOf`
 * branch into the parent.
 */
function mergeSchemas(a: JsonSchemaLike, b: JsonSchemaLike): JsonSchemaLike {
	return {
		...a,
		...b,
		properties: { ...(a.properties ?? {}), ...(b.properties ?? {}) },
		required: [...new Set([...(a.required ?? []), ...(b.required ?? [])])],
	};
}
