import type {
	RequestOverrides,
	ToggleKeyValueOverride,
	WorkflowEdge,
	WorkflowFile,
	WorkflowNode,
	WorkflowNodeKind,
} from '../schemas/beak-workflow';

export type { RequestOverrides, ToggleKeyValueOverride, WorkflowEdge, WorkflowFile, WorkflowNode, WorkflowNodeKind };

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

export interface RemoveNodePayload extends WorkflowId {
	nodeId: string;
}

export interface AddEdgePayload extends WorkflowId {
	edge: WorkflowEdge;
}

export interface RemoveEdgePayload extends WorkflowId {
	edgeId: string;
}

export interface ReplaceGraphPayload extends WorkflowId {
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
}
