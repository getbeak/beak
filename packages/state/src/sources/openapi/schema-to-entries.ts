import ksuid from '@beak/ksuid';
import type { EntryMap, NamedEntries } from '@getbeak/types/body-editor-json';

import type { OpenApiDocument, OpenApiReference, OpenApiSchema } from './types';

/**
 * Pure OpenAPI-schema → Beak `EntryMap` converter. The renderer-side
 * `json-schema-import` package does the same job for user-pasted JSON
 * Schema, but it operates on strings + a draft-agnostic shape; the
 * OpenAPI flavour is different enough (component refs, no `$defs`,
 * `nullable` instead of `type: null` unions) to warrant its own pass.
 *
 * Supported:
 *  - `type` ∈ string|number|integer|boolean|null|array|object → maps to
 *    Beak's equivalent `EntryType`.
 *  - `properties` + `required` on objects → object entries with required
 *    propagated to each child.
 *  - `items` on arrays — single-schema seed (one child).
 *  - `enum` on any primitive → enum entry, options preserved as typed
 *    primitives so `[200, 404]` stays a number enum.
 *  - `description` → carried onto every entry.
 *  - `default` / `example` → seed value for string / number / enum.
 *  - `$ref` — resolved against `components.schemas`. External refs are
 *    skipped (fall through to a string entry with a warning).
 *  - `nullable: true` — recorded but ignored at the schema level (the
 *    runtime accepts null already; we don't add a separate null variant).
 *  - `allOf` / `anyOf` / `oneOf` — shallow-merge / first-branch picks.
 *
 * Out of scope (deferred):
 *  - `additionalProperties` — schema models open vs closed objects, but
 *    Beak's editor doesn't surface that distinction yet.
 *  - Pattern / format constraints beyond what Beak's value types carry.
 */

export interface SchemaConversionResult {
	entries: EntryMap;
	warnings: string[];
}

const MAX_DEPTH = 24;

interface BuildContext {
	schema: OpenApiSchema;
	parentId: string | null;
	/** Property name in the parent's `properties` map. Undefined at the root or for array children. */
	nameOverride: string | undefined;
	entries: EntryMap;
	doc: OpenApiDocument | undefined;
	warnings: string[];
	isRequired: boolean;
	depth: number;
}

/**
 * Convert an OpenAPI schema fragment to a Beak `EntryMap`. Returns the
 * entries plus any warnings (unresolved refs, dropped composition
 * branches, etc.) so callers can surface them in import dialogs.
 */
export function openApiSchemaToEntries(
	schema: OpenApiSchema | OpenApiReference | undefined,
	doc?: OpenApiDocument,
): SchemaConversionResult {
	const entries: EntryMap = {};
	const warnings: string[] = [];

	if (!schema) return { entries, warnings };

	const resolved = isReference(schema) ? resolveRef(schema.$ref, doc, warnings) : schema;
	if (!resolved) return { entries, warnings };

	// Skip example-only schemas. If the schema doesn't actually describe a
	// shape (no type, no properties, no items, no $ref, no enum) there's
	// nothing for the structured editor to work with — let the caller fall
	// back to a text-body example dump instead of inventing an empty leaf.
	if (!hasStructuralHint(resolved)) return { entries, warnings };

	buildEntry({
		schema: resolved,
		parentId: null,
		nameOverride: undefined,
		entries,
		doc,
		warnings,
		isRequired: false,
		depth: 0,
	});

	return { entries, warnings };
}

function hasStructuralHint(schema: OpenApiSchema): boolean {
	if (schema.type) return true;
	if (schema.properties && Object.keys(schema.properties).length > 0) return true;
	if (schema.items) return true;
	if (schema.$ref) return true;
	if (Array.isArray(schema.enum) && schema.enum.length > 0) return true;
	if (schema.allOf?.length) return true;
	if (schema.anyOf?.length) return true;
	if (schema.oneOf?.length) return true;
	return false;
}

function buildEntry(ctx: BuildContext): string | undefined {
	if (ctx.depth > MAX_DEPTH) {
		ctx.warnings.push(`Schema nesting exceeded ${MAX_DEPTH} levels — truncating.`);
		return placeholder(ctx);
	}

	const resolved = resolveComposition(ctx.schema, ctx.doc, ctx.warnings);
	if (!resolved) return placeholder(ctx);

	const description = typeof resolved.description === 'string' ? resolved.description : undefined;
	const required = ctx.isRequired === true;

	// Enum wins regardless of type — its options are the constraint, and
	// the value-cell picker is the most useful shape Beak has for closed
	// sets.
	if (Array.isArray(resolved.enum) && resolved.enum.length > 0) {
		const id = ksuid.generate('jsonentry').toString();
		const seed = pickSeedValue(resolved);
		ctx.entries[id] = decorate(
			{
				id,
				parentId: ctx.parentId,
				name: ctx.nameOverride,
				type: 'enum',
				enabled: true,
				value: seed !== undefined ? [String(seed)] : [],
				options: resolved.enum.filter(isPrimitive) as (string | number | boolean | null)[],
			} as unknown as NamedEntries,
			{ description, required },
		);
		return id;
	}

	const beakType = pickType(resolved);

	if (beakType === 'object') {
		const id = ksuid.generate('jsonentry').toString();
		ctx.entries[id] = decorate(
			{ id, parentId: ctx.parentId, name: ctx.nameOverride, type: 'object', enabled: true } as NamedEntries,
			{ description, required },
		);
		const requiredSet = new Set(resolved.required ?? []);
		const props = resolved.properties ?? {};
		for (const key of Object.keys(props)) {
			const child = props[key];
			const resolvedChild = isReference(child) ? resolveRef(child.$ref, ctx.doc, ctx.warnings) : child;
			if (!resolvedChild) continue;
			buildEntry({
				schema: resolvedChild,
				parentId: id,
				nameOverride: key,
				entries: ctx.entries,
				doc: ctx.doc,
				warnings: ctx.warnings,
				isRequired: requiredSet.has(key),
				depth: ctx.depth + 1,
			});
		}
		return id;
	}

	if (beakType === 'array') {
		const id = ksuid.generate('jsonentry').toString();
		ctx.entries[id] = decorate(
			{ id, parentId: ctx.parentId, name: ctx.nameOverride, type: 'array', enabled: true } as NamedEntries,
			{ description, required },
		);
		const itemSchema = isReference(resolved.items)
			? resolveRef(resolved.items.$ref, ctx.doc, ctx.warnings)
			: resolved.items;
		if (itemSchema && typeof itemSchema === 'object') {
			buildEntry({
				schema: itemSchema as OpenApiSchema,
				parentId: id,
				nameOverride: undefined,
				entries: ctx.entries,
				doc: ctx.doc,
				warnings: ctx.warnings,
				isRequired: false,
				depth: ctx.depth + 1,
			});
		}
		return id;
	}

	if (beakType === 'boolean') {
		const id = ksuid.generate('jsonentry').toString();
		const seed = pickSeedValue(resolved);
		ctx.entries[id] = decorate(
			{
				id,
				parentId: ctx.parentId,
				name: ctx.nameOverride,
				type: 'boolean',
				enabled: true,
				value: typeof seed === 'boolean' ? seed : false,
			} as NamedEntries,
			{ description, required },
		);
		return id;
	}

	if (beakType === 'null') {
		const id = ksuid.generate('jsonentry').toString();
		ctx.entries[id] = decorate(
			{ id, parentId: ctx.parentId, name: ctx.nameOverride, type: 'null', enabled: true, value: null } as NamedEntries,
			{ description, required },
		);
		return id;
	}

	// string + number leafs — both carry a ValueSections of one literal part
	const id = ksuid.generate('jsonentry').toString();
	const seed = pickSeedValue(resolved);
	ctx.entries[id] = decorate(
		{
			id,
			parentId: ctx.parentId,
			name: ctx.nameOverride,
			type: beakType,
			enabled: true,
			value: seed !== undefined ? [String(seed)] : [],
		} as NamedEntries,
		{ description, required },
	);
	return id;
}

function placeholder(ctx: BuildContext): string {
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

function decorate(entry: NamedEntries, opts: { description?: string; required: boolean }): NamedEntries {
	if (opts.description) entry.description = opts.description;
	if (opts.required) entry.required = true;
	return entry;
}

/**
 * Map an OpenAPI `type` to Beak's `EntryType`. Integer collapses to
 * number — Beak's editor doesn't have a separate integer affordance.
 * Falls back to string with a structural guess (`properties` → object,
 * `items` → array) for schemas that omit `type`.
 */
function pickType(schema: OpenApiSchema): 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' {
	switch (schema.type) {
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
	if (schema.properties) return 'object';
	if (schema.items) return 'array';
	return 'string';
}

function pickSeedValue(schema: OpenApiSchema): unknown {
	if (schema.default !== undefined) return schema.default;
	if (schema.example !== undefined) return schema.example;
	if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];
	return undefined;
}

function isReference(value: unknown): value is OpenApiReference {
	return (
		typeof value === 'object' && value !== null && '$ref' in value && typeof (value as OpenApiReference).$ref === 'string'
	);
}

function isPrimitive(value: unknown): boolean {
	if (value === null) return true;
	const t = typeof value;
	return t === 'string' || t === 'number' || t === 'boolean';
}

/**
 * Resolve a `#/components/schemas/Foo` ref against the OpenAPI document.
 * Returns null for external refs (`http://…`, `./other.yaml#/…`) — those
 * would need a fetcher we don't have, and most specs author everything
 * inline anyway. Adds a warning so the user knows why a node is empty.
 */
function resolveRef(ref: string, doc: OpenApiDocument | undefined, warnings: string[]): OpenApiSchema | null {
	if (!doc) {
		warnings.push(`Skipped $ref (no document context): ${ref}`);
		return null;
	}
	if (!ref.startsWith('#/')) {
		warnings.push(`Skipped external $ref: ${ref}`);
		return null;
	}
	const path = ref.slice(2).split('/');
	// OpenAPI 3: `#/components/schemas/<Name>`
	// Older / hand-authored: `#/definitions/<Name>` — accept both for tolerance.
	if (path[0] === 'components' && path[1] === 'schemas') {
		const target = doc.components?.schemas?.[path[2]];
		if (target) return target;
	}
	warnings.push(`Unresolved $ref: ${ref}`);
	return null;
}

/**
 * Shallow-merge a schema with the first branch of any composition
 * keyword (`allOf` / `anyOf` / `oneOf`). Picking the first branch is a
 * pragmatic seed — full union resolution would need to synthesise an
 * intersection / discriminator-aware tree, which is much heavier work.
 */
function resolveComposition(
	schema: OpenApiSchema,
	doc: OpenApiDocument | undefined,
	warnings: string[],
): OpenApiSchema | null {
	let merged: OpenApiSchema = schema;
	const branch = schema.allOf?.[0] ?? schema.anyOf?.[0] ?? schema.oneOf?.[0];
	if (branch) {
		const resolvedBranch = isReference(branch) ? resolveRef(branch.$ref, doc, warnings) : branch;
		if (resolvedBranch) merged = mergeSchemas(merged, resolvedBranch);
	}
	return merged;
}

function mergeSchemas(a: OpenApiSchema, b: OpenApiSchema): OpenApiSchema {
	return {
		...a,
		...b,
		properties: { ...(a.properties ?? {}), ...(b.properties ?? {}) },
		required: Array.from(new Set([...(a.required ?? []), ...(b.required ?? [])])),
	};
}
