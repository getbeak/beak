import { z } from 'zod';

/**
 * Workflow file — `workflows/<id>.json` on disk. A workflow is a directed graph
 * of nodes (requests, loops, conditions, notifications) connected by edges.
 * The renderer ships an xyflow editor for these graphs; flight orchestration
 * across the graph is a follow-up.
 *
 * Node kinds are an open union — adding a new kind requires extending this
 * schema. Each kind stashes its kind-specific config under `data`, common
 * canvas state (position) lives at the top level so xyflow can read it
 * without unwrapping.
 */
const nodePositionSchema = z.object({
	x: z.number(),
	y: z.number(),
});

/**
 * The implicit entry point of a workflow. Auto-created with every new
 * workflow and capped at one per workflow — the orchestrator starts here and
 * follows outbound edges. No input handle, no configuration.
 */
const startNodeSchema = z.object({
	id: z.string(),
	type: z.literal('start'),
	position: nodePositionSchema,
	name: z.string().optional(),
	data: z.object({}),
});

/**
 * Per-entry override slot. Keyed by the linked request's entry id (header /
 * query / json / form ksuid), so the override naturally "rides on top of"
 * the linked schema without duplicating its name/type/required/description
 * fields. Both fields are optional — a missing key means "pass through the
 * linked value"; an explicit `false` on `enabled` disables an otherwise-on
 * row for this step only.
 *
 * `value` is `unknown` because the linked entry's value shape varies by
 * type — `ValueSections` (array) for headers, query, and most JSON entry
 * types; `boolean` for JSON boolean entries; `null` for null entries. The
 * renderer knows the linked entry's type at merge time and writes the
 * right shape here.
 */
const overrideEntrySchema = z.object({
	value: z.unknown().optional(),
	enabled: z.boolean().optional(),
});

/**
 * Per-step request overrides. Every slot is optional — a missing key means
 * "use the linked request's value verbatim". Headers, query, and body
 * fields are keyed by the linked request's entry id so the override map
 * stays minimal (only the cells the user actually touched). Schema-side
 * fields (`name`, `type`, `required`, `description`, `options`) live on the
 * linked request — workflow steps only override values and the per-row
 * enabled flag, and only on rows the linked schema marks optional.
 */
const requestOverridesSchema = z
	.object({
		headers: z.record(z.string(), overrideEntrySchema).optional(),
		query: z.record(z.string(), overrideEntrySchema).optional(),
		body: z
			.object({
				/**
				 * Per-field overrides for structured bodies — keyed by the
				 * linked JSON entry id (`json` body), url-encoded form entry
				 * id (`url_encoded_form` body), or GraphQL variables entry id
				 * (`graphql` body). The renderer picks the relevant editor
				 * from the linked body's type.
				 */
				fields: z.record(z.string(), overrideEntrySchema).optional(),
				/**
				 * Free-form text replacement for opaque body types (`text`,
				 * `json_raw`). Replaces the whole payload — there's no schema
				 * to overlay against, so per-field overrides don't apply.
				 */
				raw: z
					.object({
						contentType: z.string().optional(),
						text: z.array(z.unknown()).optional(),
					})
					.optional(),
			})
			.optional(),
		// The URL itself is fixed by the linked request, but the fragment
		// (`#hash`) is per-step territory — useful for SPA-style endpoints
		// where the fragment changes per call.
		fragment: z.array(z.unknown()).optional(),
	})
	.optional();

const requestNodeSchema = z.object({
	id: z.string(),
	type: z.literal('request'),
	position: nodePositionSchema,
	name: z.string().optional(),
	data: z.object({
		// References a request in tree/ — null until the user picks one.
		requestId: z.string().nullable(),
		overrides: requestOverridesSchema,
	}),
});

export type OverrideEntry = z.infer<typeof overrideEntrySchema>;
export type RequestOverrides = NonNullable<z.infer<typeof requestOverridesSchema>>;

const loopNodeSchema = z.object({
	id: z.string(),
	type: z.literal('loop'),
	position: nodePositionSchema,
	name: z.string().optional(),
	data: z.object({
		// `count` runs the inner branch N times; `forEach` iterates a value
		// section (typically a response-body-json array ref). Both empty by
		// default — the user picks one.
		mode: z.union([z.literal('count'), z.literal('forEach')]),
		count: z.number().int().nonnegative().optional(),
		// We persist `forEach` as a value-sections array (the same ValueParts
		// shape used elsewhere) but keep it loose here — the renderer types it.
		forEach: z.array(z.unknown()).optional(),
	}),
});

const conditionNodeSchema = z.object({
	id: z.string(),
	type: z.literal('condition'),
	position: nodePositionSchema,
	name: z.string().optional(),
	data: z.object({
		/**
		 * Dot path into the incoming node's output, e.g. `body.user.id` or
		 * `status`. When unset the condition reads the entire incoming value.
		 * The orchestrator resolves this at run time against whatever the
		 * upstream node produced.
		 */
		leftPath: z.string().optional(),
		operator: z.union([
			z.literal('equals'),
			z.literal('not_equals'),
			z.literal('contains'),
			z.literal('truthy'),
			z.literal('falsy'),
		]),
		// Right-hand side accepts value-sections (literal text + RTV chips via
		// VariableInput). Plain strings round-trip transparently.
		right: z.array(z.unknown()).optional(),
	}),
});

const notificationNodeSchema = z.object({
	id: z.string(),
	type: z.literal('notification'),
	position: nodePositionSchema,
	name: z.string().optional(),
	data: z.object({
		title: z.array(z.unknown()).optional(),
		body: z.array(z.unknown()).optional(),
	}),
});

/**
 * Comment / sticky-note node — pure documentation. Doesn't run, doesn't
 * route, doesn't carry handles (the renderer omits both `target` and
 * `source` Handles). Stays on disk as part of the graph so the user's
 * notes round-trip with the workflow file.
 */
const commentNodeSchema = z.object({
	id: z.string(),
	type: z.literal('comment'),
	position: nodePositionSchema,
	name: z.string().optional(),
	data: z.object({
		text: z.string().optional(),
	}),
});

export const workflowNodeSchema = z.discriminatedUnion('type', [
	startNodeSchema,
	requestNodeSchema,
	loopNodeSchema,
	conditionNodeSchema,
	notificationNodeSchema,
	commentNodeSchema,
]);

export const workflowEdgeSchema = z.object({
	id: z.string(),
	source: z.string(),
	target: z.string(),
	sourceHandle: z.string().nullable().optional(),
	targetHandle: z.string().nullable().optional(),
	/**
	 * Free-form label rendered inline on the edge. Useful for tagging the
	 * happy path vs an error branch, or for narrating loop body wiring.
	 */
	label: z.string().optional(),
});

export const workflowSchema = z
	.object({
		/**
		 * Schema version. Optional today so workflows pre-dating the field
		 * still parse; the writer always emits `'1'`. Bump deliberately when
		 * the on-disk shape changes — the migrator reads this to pick the
		 * right transform chain.
		 */
		version: z.string().optional(),
		id: z.string(),
		name: z.string(),
		/**
		 * Tree node id of the folder this workflow lives inside. `null` keeps
		 * it at the project root. Stored in the file (rather than derived from
		 * file location) so workflows can sit alongside requests/folders in
		 * the project tree without moving on-disk.
		 */
		parent: z.string().nullable().optional(),
		/**
		 * Free-form documentation for the workflow as a whole — surfaced in
		 * the empty-selection panel and the Markdown export. Not parsed.
		 */
		description: z.string().optional(),
		nodes: z.array(workflowNodeSchema),
		edges: z.array(workflowEdgeSchema),
	})
	.strict();

export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type WorkflowFile = z.infer<typeof workflowSchema>;
export type WorkflowNodeKind = WorkflowNode['type'];
