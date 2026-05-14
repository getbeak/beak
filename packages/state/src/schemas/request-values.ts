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

const valuePartsSchema: z.ZodType = z.array(
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

export type PropertyValue = z.infer<typeof propertyValueSchema>;

/** Map of property values keyed by the schema property's `id`. */
export const propertyValueMapSchema = z.record(z.string(), propertyValueSchema);

export type PropertyValueMap = z.infer<typeof propertyValueMapSchema>;

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
]);

export type BodyValue = z.infer<typeof bodyValueSchema>;

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

export type RequestValues = z.infer<typeof requestValuesSchema>;

/** Map of `requestId → values`. Persisted to `.beak/values.json`. */
export const projectRequestValuesSchema = z.record(z.string(), requestValuesSchema);

export type ProjectRequestValues = z.infer<typeof projectRequestValuesSchema>;

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

export type ProjectValuesFile = z.infer<typeof projectValuesFileSchema>;

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
