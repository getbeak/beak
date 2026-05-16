import { z } from 'zod';

/**
 * Project file — the `project.json` at the root of a Beak project.
 */
export const projectFileSchema = z
	.object({
		id: z.string().min(1),
		version: z.string().min(1),
		name: z.string().min(1),
		untitled: z.boolean().optional(),
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
		type: z.literal('enum'),
		value: valuePartsSchema.optional(),
		options: z.array(z.string()).optional(),
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

/**
 * Per-request runtime options. Shared between request files, sparse
 * overrides, and collection defaults so all three places stay in lockstep.
 * All fields are optional — defaults come from the project's request
 * factory.
 */
const requestOptionsSchema = z
	.object({
		followRedirects: z.boolean().optional(),
		decompressResponse: z.boolean().optional(),
		timeoutMs: z.number().int().min(0).optional(),
		maxRedirects: z.number().int().min(0).optional(),
	})
	.strict();

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
			type: z.literal('json_raw'),
			payload: z.string(),
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
					/**
					 * Legacy file pointer — the renderer's old "reference file" system.
					 * Kept optional so existing projects keep loading. New uploads go
					 * through `assetRef`.
					 */
					fileReferenceId: z.string().optional(),
					/**
					 * Content-addressed pointer into the project's `_assets/` store.
					 * Phase 7+8 store. When present this is the canonical body source
					 * for flight execution; `fileReferenceId` is read-only legacy.
					 */
					assetRef: z
						.object({
							sha256: z.string().regex(/^[0-9a-f]{64}$/),
							size: z.number().int().nonnegative(),
							contentType: z.string().optional(),
						})
						.strict()
						.optional(),
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
		options: requestOptionsSchema.optional(),
	})
	.passthrough();

export type RequestFile = z.infer<typeof requestFileSchema>;

// ─── Sparse request overrides ───────────────────────────────────────
//
// When a request belongs to a collection that declares defaults, only the
// fields that DIFFER from the defaults need to be persisted. This keeps
// the diff tree quiet for routine usage of the API.

/**
 * Sparse override of a request — every field is optional. Merging defaults
 * (from the collection) onto an override produces a full `RequestFile`-shaped
 * value at runtime. `id` and `operationId` remain required for stable
 * identity across syncs.
 */
export const requestFileOverrideSchema = z
	.object({
		id: z.string().min(1),
		/** Identifier inside the source spec (e.g. OpenAPI operationId). */
		operationId: z.string().min(1).optional(),
		verb: z.string().optional(),
		url: valuePartsSchema.optional(),
		query: z.record(z.string(), keyValuePairSchema).optional(),
		headers: z.record(z.string(), keyValuePairSchema).optional(),
		body: bodySchema.optional(),
		options: requestOptionsSchema.optional(),
	})
	.passthrough();

export type RequestFileOverride = z.infer<typeof requestFileOverrideSchema>;

// ─── Collection file (`_collection.json` per folder under `tree/`) ───

/**
 * Where the requests in this collection come from. `manual` means
 * hand-written; `openapi` / `graphql` mean the contents are kept in sync
 * with an external spec. Phase 6 fills in the `openapi` source.
 */
export const collectionSourceSchema = z.discriminatedUnion('type', [
	z
		.object({
			type: z.literal('manual'),
		})
		.strict(),
	z
		.object({
			type: z.literal('openapi'),
			/** Absolute or project-relative path to the spec file. */
			specPath: z.string().min(1).optional(),
			/** Remote spec URL — fetched on sync. */
			specUrl: z.url().optional(),
			/** Last sync timestamp (ISO 8601). */
			lastSyncedAt: z.string().optional(),
			/**
			 * When true, the renderer's auto-sync poller refetches `specUrl`
			 * (or re-reads `specPath`) on the cadence below. Toggled from the
			 * Project Home tab. Flipping it does NOT trigger an immediate
			 * sync — the next poll tick picks it up.
			 */
			autoSync: z.boolean().optional(),
			/**
			 * Sync cadence in whole minutes. Defaults to 60 when `autoSync` is
			 * on. Min 1 keeps us out of tight refetch loops if a user types
			 * a bad value.
			 */
			intervalMinutes: z.number().int().min(1).optional(),
		})
		.strict()
		.refine(d => Boolean(d.specPath || d.specUrl), {
			message: 'openapi source requires specPath or specUrl',
		}),
	z
		.object({
			type: z.literal('graphql'),
			endpoint: z.string().min(1),
			lastSyncedAt: z.string().optional(),
		})
		.strict(),
	z
		.object({
			type: z.literal('grpc'),
			/** gRPC endpoint URL — e.g. `grpc.example.com:50051` or `https://...`. */
			endpoint: z.string().min(1),
			/**
			 * Optional project-relative or absolute path to a `.proto` file
			 * describing the service. Phase 2 of grpc work loads + parses
			 * this to drive method completion + request authoring. Absent
			 * means the endpoint is registered but not yet wired for
			 * descriptors.
			 */
			protoPath: z.string().min(1).optional(),
			lastSyncedAt: z.string().optional(),
		})
		.strict(),
]);

export type CollectionSource = z.infer<typeof collectionSourceSchema>;

/**
 * Shape of the defaults a collection declares. Every field is optional and
 * merges with each request file in this folder (request overrides win).
 * Intentionally a subset of `requestFileSchema` — defaults don't carry id,
 * verb is optional (often shared), etc.
 */
export const collectionDefaultsSchema = z
	.object({
		verb: z.string().optional(),
		baseUrl: valuePartsSchema.optional(),
		query: z.record(z.string(), keyValuePairSchema).optional(),
		headers: z.record(z.string(), keyValuePairSchema).optional(),
		body: bodySchema.optional(),
		options: requestOptionsSchema.optional(),
	})
	.strict();

export type CollectionDefaults = z.infer<typeof collectionDefaultsSchema>;

/**
 * Collection file — sits at the root of any folder under `tree/`. Declares
 * the source of the requests in this folder plus optional default fields.
 */
export const collectionFileSchema = z
	.object({
		source: collectionSourceSchema,
		defaults: collectionDefaultsSchema.optional(),
	})
	.strict();

export type CollectionFile = z.infer<typeof collectionFileSchema>;
