import { z } from 'zod';

/**
 * Project-wide cookie configuration. Lives on the project file because the
 * primary variable set is a property of the project, not of a particular
 * window or request.
 */
export const projectCookieConfigSchema = z
	.object({
		/**
		 * The variable set whose currently-selected item drives the
		 * "default" cookie jar — the one outgoing requests pull from by
		 * default and the one incoming Set-Cookie headers always land in.
		 * Defaults to `'Environment'` when absent so existing projects
		 * keep working without a migration.
		 */
		primaryVariableSet: z.string().min(1).optional(),
	})
	.strict();

export type ProjectCookieConfig = z.infer<typeof projectCookieConfigSchema>;

/**
 * Project file — the `project.json` at the root of a Beak project.
 */
export const projectFileSchema = z
	.object({
		id: z.string().min(1),
		version: z.string().min(1),
		name: z.string().min(1),
		untitled: z.boolean().optional(),
		cookies: projectCookieConfigSchema.optional(),
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
		/**
		 * Cookie behaviour overrides for this request.
		 *  - `sendCookies` (default `true`): opt-out — when false, no jars
		 *    contribute cookies to the outgoing request.
		 *  - `additionalCookieJarSets`: variable-set names whose currently-
		 *    selected item should layer extra cookies on top of the
		 *    project's primary jar (e.g. a `User` set alongside `Environment`).
		 *    Names must match `variableSets` keys; unknown names are ignored
		 *    at flight time.
		 */
		sendCookies: z.boolean().optional(),
		additionalCookieJarSets: z.array(z.string().min(1)).optional(),
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
	z
		.object({
			type: z.literal('grpc'),
			payload: z
				.object({
					/** Fully-qualified service name (e.g. `helloworld.HelloService`). */
					service: z.string().min(1),
					/** RPC method name on that service. */
					method: z.string().min(1),
					/**
					 * Last-known request body as a JSON string. Stored verbatim so the
					 * Monaco editor round-trips whitespace + comments faithfully.
					 */
					requestJson: z.string(),
					/** Per-call gRPC metadata. Optional for back-compat with files written before the field landed. */
					metadata: z.record(z.string(), z.string()).optional(),
				})
				.strict(),
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
		// `query` and `headers` are optional on disk so sparse OpenAPI imports
		// (operations with no query/header parameters) round-trip cleanly even
		// when the collection's defaults are empty. `ensureRuntimeShape` in
		// the renderer's reader backfills them to `{}` so downstream code can
		// still address them unconditionally.
		query: z.record(z.string(), keyValuePairSchema).optional(),
		headers: z.record(z.string(), keyValuePairSchema).optional(),
		body: bodySchema.optional(),
		options: requestOptionsSchema.optional(),
		/** Seed introspection file for an endpoint collection — see `RequestOverview.introspection`. */
		introspection: z.literal(true).optional(),
		/** Sync provenance — present only on files generated from a spec (OpenAPI / gRPC). */
		_provenance: z.lazy(() => provenanceSchema).optional(),
	})
	.passthrough();

export type RequestFile = z.infer<typeof requestFileSchema>;

// ─── Provenance (linked-to-spec marker) ─────────────────────────────

/**
 * Marks a request file as generated from an external spec. Re-syncs skip
 * any file with `linked: false` — the user took ownership and the
 * converter must leave it alone. Writes flip `linked: true → false`
 * automatically on the first user edit (see the renderer's project
 * effect); a `[Re-link]` action restores it.
 *
 * `graphql` is intentionally absent: GraphQL doesn't enumerate operations,
 * so the renderer never generates per-operation files for it.
 */
export const provenanceSchema = z
	.object({
		source: z.enum(['openapi', 'grpc']),
		linked: z.boolean(),
		/** OpenAPI operationId / gRPC fully-qualified method, etc. */
		operationId: z.string().min(1).optional(),
		/** ISO 8601 timestamp of the sync that produced (or last updated) this file. */
		syncedAt: z.string().optional(),
	})
	.strict();

export type Provenance = z.infer<typeof provenanceSchema>;

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
		/** Seed introspection file for an endpoint collection — see `RequestOverview.introspection`. */
		introspection: z.literal(true).optional(),
		/** Sync provenance — present only on files generated from a spec (OpenAPI / gRPC). */
		_provenance: z.lazy(() => provenanceSchema).optional(),
	})
	.passthrough();

export type RequestFileOverride = z.infer<typeof requestFileOverrideSchema>;

// ─── Collection file (`_collection.json` per folder under `tree/`) ───

/**
 * gRPC descriptor source — how the renderer loads method + message
 * shapes for a service. `reflection` is the cleanest UX (analogous to
 * GraphQL introspection); `proto` is the fallback for servers that
 * disable reflection in production; `buf` consumes the modern Buf
 * Schema Registry distribution path.
 */
export const grpcDescriptorSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('reflection') }).strict(),
	z
		.object({
			type: z.literal('proto'),
			/** Project-relative or absolute path to a `.proto` file. */
			path: z.string().min(1),
		})
		.strict(),
	z
		.object({
			type: z.literal('buf'),
			/** BSR module path, e.g. `buf.build/connectrpc/eliza`. */
			module: z.string().min(1),
		})
		.strict(),
]);

export type GrpcDescriptor = z.infer<typeof grpcDescriptorSchema>;

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
			/**
			 * How the spec was seeded. Drives the re-sync surface the UI shows:
			 *  - `url` — re-fetch `specUrl` on demand and on a poll cadence.
			 *  - `file` — re-read `specPath`; compare mtime to detect drift.
			 *  - `paste` — one-shot literal paste; no re-sync source.
			 * Optional for back-compat: readers fall back to whichever of
			 * `specUrl` / `specPath` is set.
			 */
			seedMode: z.enum(['url', 'file', 'paste']).optional(),
			/** Absolute or project-relative path to the spec file. */
			specPath: z.string().min(1).optional(),
			/** Remote spec URL — fetched on sync. */
			specUrl: z.url().optional(),
			/** Last sync timestamp (ISO 8601). */
			lastSyncedAt: z.string().optional(),
			/**
			 * When true, the renderer's auto-sync poller refetches `specUrl`
			 * on the cadence below. Toggled from the OpenAPI sidebar pane.
			 * Flipping it does NOT trigger an immediate sync — the next poll
			 * tick picks it up.
			 */
			autoSync: z.boolean().optional(),
			/**
			 * Sync cadence in whole minutes. Defaults to 60 when `autoSync` is
			 * on. Min 1 keeps us out of tight refetch loops if a user types
			 * a bad value.
			 */
			intervalMinutes: z.number().int().min(1).optional(),
		})
		.strict(),
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
			 * How method + message descriptors get loaded for this service.
			 *
			 *  - `reflection` — the gRPC server runs the reflection service
			 *    (`grpc.reflection.v1.ServerReflection`). Default — same UX as
			 *    GraphQL introspection: point at the URL, hit Discover, done.
			 *  - `proto` — local `.proto` file at the given path (project
			 *    relative or absolute). Fallback for servers that don't enable
			 *    reflection (often the case in production for security
			 *    reasons).
			 *  - `buf` — module on the Buf Schema Registry, e.g.
			 *    `buf.build/connectrpc/eliza`. Fetched + parsed on Discover.
			 *
			 * Absent means descriptors haven't been picked yet — the endpoint
			 * is registered but the request pane can't offer method completion
			 * until one is chosen.
			 */
			descriptor: grpcDescriptorSchema.optional(),
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
