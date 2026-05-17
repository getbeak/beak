import { z } from 'zod';

/**
 * Request schema — the structural contract of a request.
 *
 * A request file's `headers`, `query`, and `body` describe **what shape** the
 * request takes (named fields, their types, their constraints). The concrete
 * values that fill in this shape live in the renderer-side `request-values`
 * slice and are persisted per-project (see `request-values.ts`). The
 * separation keeps request files clean diffs of the API contract, while
 * day-to-day "I changed my bearer token" churn stays out of git.
 *
 * URL, verb, and options are NOT part of the schema — they are static across
 * all values and live on the request file directly.
 */

// ─── Property constraints ─────────────────────────────────────────────────
//
// Optional, type-specific restrictions on what counts as a valid value for
// a property. Used in value mode to surface inline hints and to validate
// before flight. All fields optional; an empty constraints object is
// equivalent to no constraints.

export const propertyConstraintsSchema = z
	.object({
		/**
		 * Restricts the value to one of an explicit enumeration. Typed
		 * primitives — `string | number | boolean | null` — matching JSON
		 * Schema's `enum` keyword.
		 */
		enum: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
		/** Numeric minimum (inclusive). */
		min: z.number().optional(),
		/** Numeric maximum (inclusive). */
		max: z.number().optional(),
		/** Numeric integer-only flag. */
		integer: z.boolean().optional(),
		/** Minimum string length. */
		minLength: z.number().int().min(0).optional(),
		/** Maximum string length. */
		maxLength: z.number().int().min(0).optional(),
		/** Regex pattern (string, JS-flavour). */
		pattern: z.string().optional(),
		/** Well-known string formats (email, url, uuid, date-time, ipv4, ipv6). */
		format: z.enum(['email', 'url', 'uri', 'uuid', 'date', 'date-time', 'ipv4', 'ipv6']).optional(),
	})
	.strict();

export type PropertyConstraints = z.infer<typeof propertyConstraintsSchema>;

// ─── Body JSON schema ─────────────────────────────────────────────────────
//
// The JSON body's schema is a tree of typed property definitions — one node
// per JSON value, just like the existing `EntryMap` but stripped of value
// data. Named entries live under objects; anonymous entries live under
// arrays. Tree shape is encoded by `parentId` (`null` for the root).

const jsonPropertyBaseSchema = z
	.object({
		id: z.string().min(1),
		parentId: z.string().min(1).nullable(),
		/** Anonymous (array children) omit `name`. */
		name: z.string().optional(),
		/** Marks this property as required; flight prep enforces presence. */
		required: z.boolean().optional(),
		/** Free-text hint shown above the value input in value mode. */
		description: z.string().optional(),
		/** Optional constraints (enum, min/max, pattern, format, …). */
		constraints: propertyConstraintsSchema.optional(),
	})
	.passthrough();

/**
 * One node in the JSON body schema tree. Type-discriminated on `type`; each
 * type carries its own `defaultValue` shape so the editor can seed a fresh
 * value when none has been entered yet.
 */
export const jsonPropertySchema = z.discriminatedUnion('type', [
	jsonPropertyBaseSchema.extend({
		type: z.literal('null'),
		defaultValue: z.null().optional(),
	}),
	jsonPropertyBaseSchema.extend({
		type: z.literal('boolean'),
		defaultValue: z.boolean().optional(),
	}),
	jsonPropertyBaseSchema.extend({
		type: z.literal('string'),
		/** Default literal string — value-mode placeholder when no value set. */
		defaultValue: z.string().optional(),
	}),
	jsonPropertyBaseSchema.extend({
		type: z.literal('number'),
		defaultValue: z.number().optional(),
	}),
	jsonPropertyBaseSchema.extend({
		type: z.literal('array'),
	}),
	jsonPropertyBaseSchema.extend({
		type: z.literal('object'),
	}),
]);

export type JsonProperty = z.infer<typeof jsonPropertySchema>;

/** Map of JSON property nodes by `id`. Mirrors the existing `EntryMap`. */
export const jsonPropertyMapSchema = z.record(z.string(), jsonPropertySchema);

export type JsonPropertyMap = z.infer<typeof jsonPropertyMapSchema>;

// ─── Scalar property schema (headers + query) ─────────────────────────────
//
// Headers and query parameters are always scalar — there's no nesting on the
// wire — so their schema is a flat list of named property definitions. The
// shape mirrors json properties but is constrained to scalar types.

export const scalarPropertyTypeSchema = z.enum(['string', 'number', 'boolean', 'enum', 'token']);

export type ScalarPropertyType = z.infer<typeof scalarPropertyTypeSchema>;

/**
 * One header or query parameter definition. `token` is a UX-only hint that
 * the editor should mask the value (e.g. for bearer tokens / API keys);
 * on-wire it serialises identically to `string`.
 */
export const scalarPropertySchema = z
	.object({
		id: z.string().min(1),
		name: z.string(),
		type: scalarPropertyTypeSchema,
		/** Marks this parameter as required; flight prep enforces presence. */
		required: z.boolean().optional(),
		/** Free-text hint shown next to the value input. */
		description: z.string().optional(),
		/** Default literal string. */
		defaultValue: z.string().optional(),
		/** Optional constraints (enum, min/max, pattern, format, …). */
		constraints: propertyConstraintsSchema.optional(),
	})
	.passthrough();

export type ScalarProperty = z.infer<typeof scalarPropertySchema>;

/** Ordered list of scalar property defs (headers / query). */
export const scalarPropertyListSchema = z.array(scalarPropertySchema);

export type ScalarPropertyList = z.infer<typeof scalarPropertyListSchema>;

// ─── Body schema ──────────────────────────────────────────────────────────
//
// Body schema mirrors the body type set. For structured bodies (json,
// url_encoded_form, graphql) the schema describes the fields; for opaque
// bodies (text, json_raw, file) the schema is essentially a type marker.

export const bodySchemaSchema = z.discriminatedUnion('type', [
	z
		.object({
			type: z.literal('none'),
		})
		.strict(),
	z
		.object({
			type: z.literal('text'),
			contentType: z.string().optional(),
		})
		.strict(),
	z
		.object({
			type: z.literal('json_raw'),
		})
		.strict(),
	z
		.object({
			type: z.literal('json'),
			/** Tree of typed json property nodes. */
			properties: jsonPropertyMapSchema,
		})
		.strict(),
	z
		.object({
			type: z.literal('url_encoded_form'),
			fields: scalarPropertyListSchema,
		})
		.strict(),
	z
		.object({
			type: z.literal('file'),
			/** Comma-separated mime-type accept hint shown in the file picker. */
			accept: z.string().optional(),
		})
		.strict(),
	z
		.object({
			type: z.literal('graphql'),
			query: z.string(),
			variables: jsonPropertyMapSchema,
		})
		.strict(),
	z
		.object({
			type: z.literal('grpc'),
			/** Fully-qualified service name. */
			service: z.string().min(1),
			/** Method on that service. */
			method: z.string().min(1),
		})
		.strict(),
]);

export type BodySchema = z.infer<typeof bodySchemaSchema>;

// ─── Request schema ───────────────────────────────────────────────────────

/**
 * Full structural contract of a request — what fields it accepts, of what
 * types, with what constraints. Concrete values that satisfy this schema
 * live in the per-project values store. URL/verb/options stay on the
 * request file directly (they're not "schema-shaped" — they're identifying
 * + behavioural fields).
 */
export const requestSchemaSchema = z
	.object({
		headers: scalarPropertyListSchema,
		query: scalarPropertyListSchema,
		body: bodySchemaSchema,
	})
	.strict();

export type RequestSchema = z.infer<typeof requestSchemaSchema>;

/** A fresh, empty request schema — body absent, no headers, no query. */
export function emptyRequestSchema(): RequestSchema {
	return {
		headers: [],
		query: [],
		body: { type: 'none' },
	};
}
