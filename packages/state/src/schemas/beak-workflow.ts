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
	data: z.object({}),
});

/**
 * A subset of the on-disk `ToggleKeyValue` shape (header/query rows). We
 * persist the same ksuid→entry record the request file uses so future RTV
 * editor work plugs in without a migration. `value` is value-sections (array
 * of string-or-RTV parts) — bare-bones editors today write `[string]`, the
 * RTV editor pass replaces the parts in place.
 */
const toggleKeyValueOverrideSchema = z.object({
	name: z.string(),
	value: z.array(z.unknown()),
	enabled: z.boolean(),
});

/**
 * Per-step request overrides. Each field is optional — a missing key means
 * "use the linked request's value verbatim". Headers + query are keyed by
 * ksuid so reorder + RTV-binding tools can address rows individually.
 */
const requestOverridesSchema = z
	.object({
		headers: z.record(z.string(), toggleKeyValueOverrideSchema).optional(),
		query: z.record(z.string(), toggleKeyValueOverrideSchema).optional(),
		body: z
			.object({
				// Minimal body override surface — content-type + raw text. The
				// linked request's structured body editor (json, form, file) is
				// the source of truth; this slot lets a step swap in a different
				// payload without re-authoring the request.
				contentType: z.string().optional(),
				text: z.array(z.unknown()).optional(),
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
	data: z.object({
		// References a request in tree/ — null until the user picks one.
		requestId: z.string().nullable(),
		overrides: requestOverridesSchema,
	}),
});

export type ToggleKeyValueOverride = z.infer<typeof toggleKeyValueOverrideSchema>;
export type RequestOverrides = NonNullable<z.infer<typeof requestOverridesSchema>>;

const loopNodeSchema = z.object({
	id: z.string(),
	type: z.literal('loop'),
	position: nodePositionSchema,
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
	data: z.object({
		title: z.array(z.unknown()).optional(),
		body: z.array(z.unknown()).optional(),
	}),
});

export const workflowNodeSchema = z.discriminatedUnion('type', [
	startNodeSchema,
	requestNodeSchema,
	loopNodeSchema,
	conditionNodeSchema,
	notificationNodeSchema,
]);

export const workflowEdgeSchema = z.object({
	id: z.string(),
	source: z.string(),
	target: z.string(),
	sourceHandle: z.string().nullable().optional(),
	targetHandle: z.string().nullable().optional(),
});

export const workflowSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		/**
		 * Tree node id of the folder this workflow lives inside. `null` keeps
		 * it at the project root. Stored in the file (rather than derived from
		 * file location) so workflows can sit alongside requests/folders in
		 * the project tree without moving on-disk.
		 */
		parent: z.string().nullable().optional(),
		nodes: z.array(workflowNodeSchema),
		edges: z.array(workflowEdgeSchema),
	})
	.strict();

export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type WorkflowFile = z.infer<typeof workflowSchema>;
export type WorkflowNodeKind = WorkflowNode['type'];
