import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import type { WorkflowsState } from './types';
import {
	addEdge,
	addNode,
	clearGraph,
	duplicateNode,
	insertNewWorkflow,
	moveNode,
	purgeRequestRefs,
	removeEdge,
	removeNode,
	removeNodes,
	removeWorkflowFromStore,
	renameNode,
	replaceGraph,
	setWorkflowParent,
	setWorkflowTags,
	startWorkflows,
	updateEdgeLabel,
	updateNode,
	updateNodeData,
	updateWorkflowDescription,
	updateWorkflowName,
	workflowsOpened,
} from './workflows-slice';

/**
 * Attaches the pure workflows reducer cases to the given builder. The
 * builder's state type only needs to be a subtype of WorkflowsState — UI
 * packages compose this into a wider state shape with file-watch coordination
 * fields (see `@beak/ui/src/store/workflows/reducers.ts`).
 *
 * This shim keeps the published `buildWorkflowsReducer` signature intact so
 * existing consumers (tests, UI reducer composition) don't need changes.
 * The real logic now lives in `workflows-slice.ts` (ADR 0005).
 */
export function buildWorkflowsReducer<S extends WorkflowsState>(builder: ActionReducerMapBuilder<S>) {
	// Re-export every case from the createSlice-generated action creators.
	// The slice handles the same action type strings (e.g. 'workflows/addNode')
	// so action creators emitted by the old actions.ts and the new slice are
	// interchangeable — they share the same type string constant.
	builder
		.addCase(startWorkflows, state => {
			state.loaded = false;
		})
		.addCase(workflowsOpened, (state, { payload }) => {
			state.workflows = payload.workflows;
			state.loaded = true;
		})
		.addCase(insertNewWorkflow, (state, { payload }) => {
			const incoming = payload.workflow;
			// TODO ADR 0005 §2 — Date.now() non-deterministic side-effect.
			const next = incoming.createdAt ? incoming : { ...incoming, createdAt: Date.now() };
			state.workflows[payload.id] = next;
		})
		.addCase(updateWorkflowName, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.name = payload.name;
			touch(workflow);
		})
		.addCase(updateWorkflowDescription, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const trimmed = payload.description?.trim();
			if (trimmed) workflow.description = trimmed;
			else delete workflow.description;
			touch(workflow);
		})
		.addCase(setWorkflowTags, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
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
		})
		.addCase(setWorkflowParent, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.parent = payload.parent;
			touch(workflow);
		})
		.addCase(addNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes.push(payload.node);
			touch(workflow);
		})
		.addCase(updateNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const idx = workflow.nodes.findIndex(n => n.id === payload.nodeId);
			if (idx === -1) return;
			workflow.nodes[idx] = { ...workflow.nodes[idx], ...payload.patch } as (typeof workflow.nodes)[number];
			touch(workflow);
		})
		.addCase(updateNodeData, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			node.data = { ...node.data, ...payload.data } as typeof node.data;
			touch(workflow);
		})
		.addCase(moveNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			node.position = payload.position;
			touch(workflow);
		})
		.addCase(renameNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			const trimmed = payload.name?.trim();
			if (trimmed) (node as { name?: string }).name = trimmed;
			else delete (node as { name?: string }).name;
			touch(workflow);
		})
		.addCase(removeNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes = workflow.nodes.filter(n => n.id !== payload.nodeId);
			workflow.edges = workflow.edges.filter(e => e.source !== payload.nodeId && e.target !== payload.nodeId);
			touch(workflow);
		})
		.addCase(removeNodes, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			if (payload.nodeIds.length === 0) return;
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
		})
		.addCase(duplicateNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const source = workflow.nodes.find(n => n.id === payload.sourceNodeId);
			if (!source) return;
			if (source.type === 'start') return;
			// TODO ADR 0005 §4 — JSON clone is inline structural logic.
			const cloned = {
				...source,
				id: payload.newNodeId,
				position: payload.position,
				data: JSON.parse(JSON.stringify(source.data)),
			} as (typeof workflow.nodes)[number];
			workflow.nodes.push(cloned);
			touch(workflow);
		})
		.addCase(addEdge, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			if (workflow.edges.some(e => e.id === payload.edge.id)) return;
			workflow.edges.push(payload.edge);
			touch(workflow);
		})
		.addCase(removeEdge, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.edges = workflow.edges.filter(e => e.id !== payload.edgeId);
			touch(workflow);
		})
		.addCase(updateEdgeLabel, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const edge = workflow.edges.find(e => e.id === payload.edgeId);
			if (!edge) return;
			if (!payload.label) {
				delete (edge as { label?: string }).label;
			} else {
				edge.label = payload.label;
			}
			touch(workflow);
		})
		.addCase(replaceGraph, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			// TODO ADR 0005 §4 — graph replacement is structural; callers own the arrays.
			workflow.nodes = payload.nodes;
			workflow.edges = payload.edges;
			touch(workflow);
		})
		.addCase(clearGraph, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes = workflow.nodes.filter(n => n.type === 'start');
			workflow.edges = [];
			touch(workflow);
		})
		.addCase(removeWorkflowFromStore, (state, { payload }) => {
			delete state.workflows[payload];
		})
		.addCase(purgeRequestRefs, (state, { payload }) => {
			// TODO ADR 0005 §4 — cross-workflow sweep; mirrors findRequestStepsUsing in helpers.ts.
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
		});
}

/**
 * Inline `Date.now()` stamping helper — call at the END of each case
 * AFTER confirming a real mutation occurred. Bypassed when the case
 * short-circuits as a no-op so identity equality stays intact for the
 * no-op tests.
 */
function touch(workflow: { updatedAt?: number }): void {
	// TODO ADR 0005 §2 — Date.now() is non-deterministic; extract to a clock
	// argument if tests ever need deterministic updatedAt values.
	workflow.updatedAt = Date.now();
}
