import type {
	OverrideEntry,
	RequestOverrides,
	WorkflowEdge,
	WorkflowFile,
	WorkflowNode,
	WorkflowNodeKind,
} from '../schemas/beak-workflow';

export type { OverrideEntry, RequestOverrides, WorkflowEdge, WorkflowFile, WorkflowNode, WorkflowNodeKind };

/**
 * Pure workflows state — UI-layer state (rename UI, file-watch coordination)
 * lives in the consuming UI package, not here. Mirrors the variable-sets
 * pure/UI split.
 */
export interface WorkflowsState {
	loaded: boolean;
	workflows: Record<string, WorkflowFile>;
}

export const initialWorkflowsState: WorkflowsState = {
	loaded: false,
	workflows: {},
};

export interface WorkflowId {
	id: string;
}

export interface WorkflowsOpenedPayload {
	workflows: Record<string, WorkflowFile>;
}

export interface InsertNewWorkflowPayload {
	id: string;
	workflow: WorkflowFile;
}

export interface UpdateWorkflowNamePayload extends WorkflowId {
	name: string;
}

export interface UpdateWorkflowDescriptionPayload extends WorkflowId {
	description: string | undefined;
}

export interface SetWorkflowParentPayload extends WorkflowId {
	parent: string | null;
}

export interface AddNodePayload extends WorkflowId {
	node: WorkflowNode;
}

export interface UpdateNodePayload extends WorkflowId {
	nodeId: string;
	patch: Partial<WorkflowNode>;
}

/**
 * Patch a node's `data` field in place. Editors use this rather than
 * `updateNode` so node-kind invariants (`type`, `position`, `id`) stay locked
 * and partial-data writes don't clobber unrelated fields.
 */
export interface UpdateNodeDataPayload extends WorkflowId {
	nodeId: string;
	data: Record<string, unknown>;
}

export interface MoveNodePayload extends WorkflowId {
	nodeId: string;
	position: { x: number; y: number };
}

/**
 * Set / clear a per-node user-friendly name. Empty / undefined drops the
 * field entirely so the on-disk file stays clean.
 */
export interface RenameNodePayload extends WorkflowId {
	nodeId: string;
	name: string | undefined;
}

export interface RemoveNodePayload extends WorkflowId {
	nodeId: string;
}

/**
 * Atomic bulk removal — drops the named nodes + every edge touching one.
 * Start nodes are silently skipped (the workflow always needs one entry
 * point); the reducer enforces this so callers don't have to filter.
 */
export interface RemoveNodesPayload extends WorkflowId {
	nodeIds: string[];
}

/**
 * Clone an existing node under a fresh id. The caller owns id minting so the
 * KSUID side-effect stays out of the pure reducer. The new node lands at
 * `position` (typically the source's position + a small offset).
 *
 * Start nodes can't be duplicated — the orchestrator only knows about one
 * entry point per workflow; the reducer enforces that invariant.
 */
export interface DuplicateNodePayload extends WorkflowId {
	sourceNodeId: string;
	newNodeId: string;
	position: { x: number; y: number };
}

export interface AddEdgePayload extends WorkflowId {
	edge: WorkflowEdge;
}

export interface RemoveEdgePayload extends WorkflowId {
	edgeId: string;
}

export interface UpdateEdgeLabelPayload extends WorkflowId {
	edgeId: string;
	label: string | undefined;
}

export interface ReplaceGraphPayload extends WorkflowId {
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
}

/**
 * Sweep across every workflow and clear `data.requestId` on any request
 * node referring to one of the supplied ids. Dispatched after the project
 * tree drops a request so workflow files stop carrying dangling references
 * that the editor renders as "Request not found".
 */
export interface PurgeRequestRefsPayload {
	requestIds: string[];
}

/**
 * Reset the graph to "Start only" — keeps the existing Start node so we
 * never end up with a workflow that has no entry point. Useful for
 * abandoning a half-built design without deleting the whole file.
 */
export interface ClearGraphPayload extends WorkflowId {}
