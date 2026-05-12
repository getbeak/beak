import { z } from 'zod';

/**
 * Project file — the `project.json` at the root of a Beak project.
 */
export const projectFileSchema = z
	.object({
		id: z.string().min(1),
		version: z.string().min(1),
		name: z.string().min(1),
	})
	.strict();

export type ProjectFile = z.infer<typeof projectFileSchema>;

// ─── Request file (the per-request `.json` under tree/) ─────────────

/**
 * A value part is either a literal string or a "realtime value" reference
 * (a typed object whose payload is interpreted by a value handler).
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

const jsonEntryBaseSchema = z
	.object({
		id: z.string().min(1),
		parentId: z.string().min(1).nullable(),
		enabled: z.boolean(),
		name: z.string().optional(),
	})
	.passthrough();

/**
 * A single entry in a structured JSON editor (the JSON body / GraphQL
 * variables editors). Type-discriminated on `type`; the `value` field
 * carries different shapes per type.
 */
const jsonEntrySchema = z.discriminatedUnion('type', [
	jsonEntryBaseSchema.extend({
		type: z.literal('null'),
		value: z.null().optional(),
	}),
	jsonEntryBaseSchema.extend({
		type: z.literal('boolean'),
		value: z.boolean().optional(),
	}),
	jsonEntryBaseSchema.extend({
		type: z.literal('string'),
		value: valuePartsSchema.optional(),
	}),
	jsonEntryBaseSchema.extend({
		type: z.literal('number'),
		value: valuePartsSchema.optional(),
	}),
	jsonEntryBaseSchema.extend({
		type: z.literal('array'),
	}),
	jsonEntryBaseSchema.extend({
		type: z.literal('object'),
	}),
]);

const keyValuePairSchema = z
	.object({
		name: z.string(),
		value: valuePartsSchema,
		enabled: z.boolean(),
	})
	.passthrough();

const graphQlSchema = z
	.object({
		query: z.string(),
		variables: z.record(z.string(), jsonEntrySchema),
	})
	.passthrough();

const bodySchema = z.discriminatedUnion('type', [
	z
		.object({
			type: z.literal('text'),
			payload: z.string(),
		})
		.passthrough(),
	z
		.object({
			type: z.literal('json'),
			payload: z.record(z.string(), jsonEntrySchema),
		})
		.passthrough(),
	z
		.object({
			type: z.literal('url_encoded_form'),
			payload: z.record(z.string(), keyValuePairSchema),
		})
		.passthrough(),
	z
		.object({
			type: z.literal('file'),
			payload: z
				.object({
					fileReferenceId: z.string().optional(),
					contentType: z.string().optional(),
				})
				.strict(),
		})
		.passthrough(),
	z
		.object({
			type: z.literal('graphql'),
			payload: graphQlSchema,
		})
		.passthrough(),
]);

/**
 * Request file — the per-request `.json` Beak persists for each request
 * in the project tree.
 */
export const requestFileSchema = z
	.object({
		id: z.string().min(1),
		verb: z.string(),
		url: valuePartsSchema,
		query: z.record(z.string(), keyValuePairSchema),
		headers: z.record(z.string(), keyValuePairSchema),
		body: bodySchema.optional(),
		options: z
			.object({
				followRedirects: z.boolean().optional(),
			})
			.strict()
			.optional(),
	})
	.passthrough();

export type RequestFile = z.infer<typeof requestFileSchema>;
