import type { ValueSections } from '@getbeak/types/values';
import { z } from 'zod';

/**
 * Request values — the concrete data that fills in a `RequestSchema`.
 *
 * Stored per-project in `.beak/values.json` (renderer keeps the parsed form
 * in the `request-values` slice). Keyed by `requestId` then by property
 * `id`. Env-specific variation is handled via variable-sets — the values
 * here are static-per-project, and variable references inside them resolve
 * at flight time.
 */

const valuePartsSchema = z.array(
	z.union([
		z.string(),
		z
			.object({
				type: z.string(),
				payload: z.object({}).passthrough().optional(),
			})
			.passthrough(),
	]),
);

// ─── Per-property value cell ──────────────────────────────────────────────
//
// Every value cell carries an `enabled` flag (so a defined-but-skipped
// property can be reflected on the wire without losing its scratch value)
// alongside the type-specific payload.

const valueCellBaseSchema = z
	.object({
		enabled: z.boolean(),
	})
	.passthrough();

export const propertyValueSchema = z.discriminatedUnion('kind', [
	valueCellBaseSchema.extend({
		kind: z.literal('string'),
		value: valuePartsSchema,
	}),
	valueCellBaseSchema.extend({
		kind: z.literal('number'),
		value: valuePartsSchema,
	}),
	valueCellBaseSchema.extend({
		kind: z.literal('boolean'),
		value: z.boolean(),
	}),
	valueCellBaseSchema.extend({
		kind: z.literal('null'),
	}),
]);

/**
 * One cell of concrete value in the request values store. Type-declared
 * explicitly (rather than inferred from `propertyValueSchema`) so the
 * `value` fields resolve to `ValueSections` from `@getbeak/types/values`
 * instead of Zod's structurally-equivalent-but-not-identical inferred
 * shape. The Zod schema is still the runtime gate; this type is the
 * TypeScript handshake with the rest of the codebase.
 */
export type PropertyValue =
	| { kind: 'string'; value: ValueSections; enabled: boolean }
	| { kind: 'number'; value: ValueSections; enabled: boolean }
	| { kind: 'boolean'; value: boolean; enabled: boolean }
	| { kind: 'null'; enabled: boolean };

/** Map of property values keyed by the schema property's `id`. */
export const propertyValueMapSchema = z.record(z.string(), propertyValueSchema);

export type PropertyValueMap = Record<string, PropertyValue>;

// ─── Body value ───────────────────────────────────────────────────────────

export const bodyValueSchema = z.discriminatedUnion('type', [
	z
		.object({
			type: z.literal('none'),
		})
		.strict(),
	z
		.object({
			type: z.literal('text'),
			payload: z.string(),
		})
		.strict(),
	z
		.object({
			type: z.literal('json_raw'),
			payload: z.string(),
		})
		.strict(),
	z
		.object({
			type: z.literal('json'),
			values: propertyValueMapSchema,
		})
		.strict(),
	z
		.object({
			type: z.literal('url_encoded_form'),
			values: propertyValueMapSchema,
		})
		.strict(),
	z
		.object({
			type: z.literal('file'),
			fileReferenceId: z.string().optional(),
			contentType: z.string().optional(),
			assetRef: z
				.object({
					sha256: z.string().regex(/^[0-9a-f]{64}$/),
					size: z.number().int().nonnegative(),
					contentType: z.string().optional(),
				})
				.strict()
				.optional(),
		})
		.strict(),
	z
		.object({
			type: z.literal('graphql'),
			query: z.string(),
			variables: propertyValueMapSchema,
		})
		.strict(),
	z
		.object({
			type: z.literal('grpc'),
			service: z.string().min(1),
			method: z.string().min(1),
			/** Request body, stored verbatim as a JSON string so the editor preserves whitespace. */
			requestJson: z.string(),
		})
		.strict(),
]);

export type BodyValue =
	| { type: 'none' }
	| { type: 'text'; payload: string }
	| { type: 'json_raw'; payload: string }
	| { type: 'json'; values: PropertyValueMap }
	| { type: 'url_encoded_form'; values: PropertyValueMap }
	| {
			type: 'file';
			fileReferenceId?: string;
			contentType?: string;
			assetRef?: { sha256: string; size: number; contentType?: string };
	  }
	| { type: 'graphql'; query: string; variables: PropertyValueMap }
	| { type: 'grpc'; service: string; method: string; requestJson: string };

// ─── Request values ───────────────────────────────────────────────────────

/**
 * Concrete values for one request — fills in the request's schema. `headers`
 * and `query` are keyed by the schema property's `id`; the order is
 * determined by the schema list, not by this map.
 */
export const requestValuesSchema = z
	.object({
		headers: propertyValueMapSchema,
		query: propertyValueMapSchema,
		body: bodyValueSchema,
	})
	.strict();

export interface RequestValues {
	headers: PropertyValueMap;
	query: PropertyValueMap;
	body: BodyValue;
}

/** Map of `requestId → values`. Persisted to `.beak/values.json`. */
export const projectRequestValuesSchema = z.record(z.string(), requestValuesSchema);

export type ProjectRequestValues = Record<string, RequestValues>;

/**
 * On-disk shape of `.beak/values.json`. Versioned so future migrations have
 * a fixed entry point.
 */
export const projectValuesFileSchema = z
	.object({
		version: z.literal(1),
		requests: projectRequestValuesSchema,
	})
	.strict();

export interface ProjectValuesFile {
	version: 1;
	requests: ProjectRequestValues;
}

/** Empty request values — body absent, no headers, no query. */
export function emptyRequestValues(): RequestValues {
	return {
		headers: {},
		query: {},
		body: { type: 'none' },
	};
}

/** Empty project values file. */
export function emptyProjectValuesFile(): ProjectValuesFile {
	return { version: 1, requests: {} };
}
