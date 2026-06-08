import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
	AddEdgePayload,
	AddNodePayload,
	ClearGraphPayload,
	DuplicateNodePayload,
	InsertNewWorkflowPayload,
	MoveNodePayload,
	PurgeRequestRefsPayload,
	RemoveEdgePayload,
	RemoveNodePayload,
	RemoveNodesPayload,
	RenameNodePayload,
	ReplaceGraphPayload,
	SetWorkflowParentPayload,
	SetWorkflowTagsPayload,
	UpdateEdgeLabelPayload,
	UpdateNodeDataPayload,
	UpdateNodePayload,
	UpdateWorkflowDescriptionPayload,
	UpdateWorkflowNamePayload,
	WorkflowsOpenedPayload,
} from './types';
import { initialWorkflowsState, type WorkflowsState } from './types';

/**
 * Inline `Date.now()` stamping helper — call at the END of each case
 * AFTER confirming a real mutation occurred. Bypassed when the case
 * short-circuits as a no-op so identity equality stays intact for the
 * no-op tests.
 */
function touch(workflow: { updatedAt?: number }): void {
	// TODO ADR 0005 §2 — Date.now() is non-deterministic side-effect; extract
	// to a clock argument if tests ever need deterministic timestamps.
	workflow.updatedAt = Date.now();
}

const workflowsSlice = createSlice({
	name: 'workflows',
	initialState: initialWorkflowsState,
	reducers: {
		startWorkflows: state => {
			state.loaded = false;
		},

		workflowsOpened: (state, { payload }: PayloadAction<WorkflowsOpenedPayload>) => {
			state.workflows = payload.workflows;
			state.loaded = true;
		},

		insertNewWorkflow: (state, { payload }: PayloadAction<InsertNewWorkflowPayload>) => {
			// Stamp createdAt only if the incoming workflow doesn't already
			// carry one (paste-imported or file-read workflows preserve the
			// original).
			// TODO ADR 0005 §2 — Date.now() stamp; same clock caveat as touch().
			const incoming = payload.workflow;
			const next = incoming.createdAt ? incoming : { ...incoming, createdAt: Date.now() };
			state.workflows[payload.id] = next;
		},

		updateWorkflowName: (state, { payload }: PayloadAction<UpdateWorkflowNamePayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.name = payload.name;
			touch(workflow);
		},

		updateWorkflowDescription: (state, { payload }: PayloadAction<UpdateWorkflowDescriptionPayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const trimmed = payload.description?.trim();
			if (trimmed) workflow.description = trimmed;
			else delete workflow.description;
			touch(workflow);
		},

		setWorkflowTags: (state, { payload }: PayloadAction<SetWorkflowTagsPayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			// Normalise: trim, lowercase, dedupe, drop empties — so the file
			// stays canonical and search works the way the user expects.
			// TODO ADR 0005 §4 — tag normalisation is inline business logic;
			// candidate for a pure helper function if reused elsewhere.
			const seen = new Set<string>();
			const next: string[] = [];
			for (const raw of payload.tags) {
				const tag = raw.trim().toLowerCase();
				if (!tag || seen.has(tag)) continue;
				seen.add(tag);
				next.push(tag);
			}
			if (next.length === 0) delete workflow.tags;
			else workflow.tags = next;
			touch(workflow);
		},

		setWorkflowParent: (state, { payload }: PayloadAction<SetWorkflowParentPayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.parent = payload.parent;
			touch(workflow);
		},

		addNode: (state, { payload }: PayloadAction<AddNodePayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes.push(payload.node);
			touch(workflow);
		},

		updateNode: (state, { payload }: PayloadAction<UpdateNodePayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const idx = workflow.nodes.findIndex(n => n.id === payload.nodeId);
			if (idx === -1) return;
			workflow.nodes[idx] = { ...workflow.nodes[idx], ...payload.patch } as (typeof workflow.nodes)[number];
			touch(workflow);
		},

		updateNodeData: (state, { payload }: PayloadAction<UpdateNodeDataPayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			// Cast through unknown — `data` shape is per-kind but the editor is
			// kind-aware and only passes valid keys for this node's kind.
			node.data = { ...node.data, ...payload.data } as typeof node.data;
			touch(workflow);
		},

		moveNode: (state, { payload }: PayloadAction<MoveNodePayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			node.position = payload.position;
			touch(workflow);
		},

		renameNode: (state, { payload }: PayloadAction<RenameNodePayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			const trimmed = payload.name?.trim();
			if (trimmed) (node as { name?: string }).name = trimmed;
			else delete (node as { name?: string }).name;
			touch(workflow);
		},

		removeNode: (state, { payload }: PayloadAction<RemoveNodePayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes = workflow.nodes.filter(n => n.id !== payload.nodeId);
			// Drop any edges touching the removed node — otherwise xyflow tries
			// to render an edge with a missing endpoint and crashes the canvas.
			workflow.edges = workflow.edges.filter(e => e.source !== payload.nodeId && e.target !== payload.nodeId);
			touch(workflow);
		},

		removeNodes: (state, { payload }: PayloadAction<RemoveNodesPayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			if (payload.nodeIds.length === 0) return;
			// Start is workflow-scoped and must never be deleted — skip it
			// rather than throwing so the caller can pass a raw selection set
			// without filtering.
			const dropping = new Set<string>();
			for (const id of payload.nodeIds) {
				const node = workflow.nodes.find(n => n.id === id);
				if (!node || node.type === 'start') continue;
				dropping.add(id);
			}
			if (dropping.size === 0) return;
			workflow.nodes = workflow.nodes.filter(n => !dropping.has(n.id));
			workflow.edges = workflow.edges.filter(e => !dropping.has(e.source) && !dropping.has(e.target));
			touch(workflow);
		},

		duplicateNode: (state, { payload }: PayloadAction<DuplicateNodePayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const source = workflow.nodes.find(n => n.id === payload.sourceNodeId);
			if (!source) return;
			// Workflows have exactly one Start node — refuse to clone it so the
			// graph can never end up with two entry points (or none, depending
			// on how the orchestrator picks).
			if (source.type === 'start') return;
			// Deep-clone via JSON — workflow node data is JSON-safe per the
			// schema, and structuredClone chokes on Immer's draft proxies.
			// TODO ADR 0005 §4 — JSON round-trip clone is inline structural logic;
			// candidate for a shared deepCloneNodeData helper.
			const cloned = {
				...source,
				id: payload.newNodeId,
				position: payload.position,
				data: JSON.parse(JSON.stringify(source.data)),
			} as (typeof workflow.nodes)[number];
			workflow.nodes.push(cloned);
			touch(workflow);
		},

		addEdge: (state, { payload }: PayloadAction<AddEdgePayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			if (workflow.edges.some(e => e.id === payload.edge.id)) return;
			workflow.edges.push(payload.edge);
			touch(workflow);
		},

		removeEdge: (state, { payload }: PayloadAction<RemoveEdgePayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.edges = workflow.edges.filter(e => e.id !== payload.edgeId);
			touch(workflow);
		},

		updateEdgeLabel: (state, { payload }: PayloadAction<UpdateEdgeLabelPayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const edge = workflow.edges.find(e => e.id === payload.edgeId);
			if (!edge) return;
			// Empty / undefined label drops the field entirely so the on-disk
			// file stays clean of empty strings.
			if (!payload.label) {
				delete (edge as { label?: string }).label;
			} else {
				edge.label = payload.label;
			}
			touch(workflow);
		},

		replaceGraph: (state, { payload }: PayloadAction<ReplaceGraphPayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			// TODO ADR 0005 §4 — graph replacement is structural; callers (layout
			// auto-arrange, import) own the new nodes/edges arrays.
			workflow.nodes = payload.nodes;
			workflow.edges = payload.edges;
			touch(workflow);
		},

		clearGraph: (state, { payload }: PayloadAction<ClearGraphPayload>) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			// Keep the Start node so the workflow always has an entry point.
			workflow.nodes = workflow.nodes.filter(n => n.type === 'start');
			workflow.edges = [];
			touch(workflow);
		},

		removeWorkflowFromStore: (state, { payload }: PayloadAction<string>) => {
			delete state.workflows[payload];
		},

		purgeRequestRefs: (state, { payload }: PayloadAction<PurgeRequestRefsPayload>) => {
			// Project tree just dropped these requests — clear every request
			// node's `data.requestId` that still points at one. Editors then
			// render the canonical "Pick a request →" empty state instead of
			// a dangling id; the workflow file will rewrite on next save.
			// TODO ADR 0005 §4 — cross-workflow sweep is business logic; the
			// helpers.ts domain helpers (e.g. findRequestStepsUsing) express
			// the same traversal shape and should be co-located eventually.
			const dropped = new Set(payload.requestIds);
			if (dropped.size === 0) return;
			for (const workflow of Object.values(state.workflows)) {
				for (const node of workflow.nodes) {
					if (node.type !== 'request') continue;
					const d = node.data as { requestId: string | null };
					if (d.requestId && dropped.has(d.requestId)) {
						d.requestId = null;
					}
				}
			}
		},
	},
});

export const {
	startWorkflows,
	workflowsOpened,
	insertNewWorkflow,
	updateWorkflowName,
	updateWorkflowDescription,
	setWorkflowTags,
	setWorkflowParent,
	addNode,
	updateNode,
	updateNodeData,
	moveNode,
	renameNode,
	removeNode,
	removeNodes,
	duplicateNode,
	addEdge,
	removeEdge,
	updateEdgeLabel,
	replaceGraph,
	clearGraph,
	removeWorkflowFromStore,
	purgeRequestRefs,
} = workflowsSlice.actions;

export default workflowsSlice.reducer;

// -- selectors --

interface WorkflowsRootState {
	global: { workflows: WorkflowsState };
}

/** Whether the initial workflow set has been loaded from disk. */
export const selectWorkflowsLoaded = (state: WorkflowsRootState) => state.global.workflows.loaded;

/** All workflows keyed by id. */
export const selectAllWorkflows = (state: WorkflowsRootState) => state.global.workflows.workflows;

/** A single workflow by id, or `undefined` if it doesn't exist. */
export const selectWorkflowById = (id: string) => (state: WorkflowsRootState) => state.global.workflows.workflows[id];

/** The nodes array for a specific workflow. */
export const selectWorkflowNodes = (id: string) => (state: WorkflowsRootState) =>
	state.global.workflows.workflows[id]?.nodes;

/** The edges array for a specific workflow. */
export const selectWorkflowEdges = (id: string) => (state: WorkflowsRootState) =>
	state.global.workflows.workflows[id]?.edges;

/** The `updatedAt` timestamp for a specific workflow (0 when absent). */
export const selectWorkflowUpdatedAt = (id: string) => (state: WorkflowsRootState) =>
	state.global.workflows.workflows[id]?.updatedAt ?? 0;

/** Whether a workflow with the given id exists in the store. */
export const selectWorkflowExists = (id: string) => (state: WorkflowsRootState) =>
	id in state.global.workflows.workflows;
