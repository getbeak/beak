import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { deepCloneNodeData } from './clone';
import { applyGraphReplacement, purgeRequestRefsFromWorkflows } from './graph-ops';
import { normaliseWorkflowTags } from './tags';
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
			const next = incoming.createdAt ? incoming : { ...incoming, createdAt: payload.now ?? Date.now() };
			state.workflows[payload.id] = next;
		})
		.addCase(updateWorkflowName, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.name = payload.name;
			touch(workflow, payload.now);
		})
		.addCase(updateWorkflowDescription, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const trimmed = payload.description?.trim();
			if (trimmed) workflow.description = trimmed;
			else delete workflow.description;
			touch(workflow, payload.now);
		})
		.addCase(setWorkflowTags, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const normalised = normaliseWorkflowTags(payload.tags);
			if (normalised) workflow.tags = normalised;
			else delete workflow.tags;
			touch(workflow, payload.now);
		})
		.addCase(setWorkflowParent, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.parent = payload.parent;
			touch(workflow, payload.now);
		})
		.addCase(addNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes.push(payload.node);
			touch(workflow, payload.now);
		})
		.addCase(updateNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const idx = workflow.nodes.findIndex(n => n.id === payload.nodeId);
			if (idx === -1) return;
			workflow.nodes[idx] = { ...workflow.nodes[idx], ...payload.patch } as (typeof workflow.nodes)[number];
			touch(workflow, payload.now);
		})
		.addCase(updateNodeData, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			node.data = { ...node.data, ...payload.data } as typeof node.data;
			touch(workflow, payload.now);
		})
		.addCase(moveNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			node.position = payload.position;
			touch(workflow, payload.now);
		})
		.addCase(renameNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			const trimmed = payload.name?.trim();
			if (trimmed) (node as { name?: string }).name = trimmed;
			else delete (node as { name?: string }).name;
			touch(workflow, payload.now);
		})
		.addCase(removeNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes = workflow.nodes.filter(n => n.id !== payload.nodeId);
			workflow.edges = workflow.edges.filter(e => e.source !== payload.nodeId && e.target !== payload.nodeId);
			touch(workflow, payload.now);
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
			touch(workflow, payload.now);
		})
		.addCase(duplicateNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const source = workflow.nodes.find(n => n.id === payload.sourceNodeId);
			if (!source) return;
			if (source.type === 'start') return;
			const cloned = deepCloneNodeData(source, payload.newNodeId, payload.position);
			workflow.nodes.push(cloned);
			touch(workflow, payload.now);
		})
		.addCase(addEdge, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			if (workflow.edges.some(e => e.id === payload.edge.id)) return;
			workflow.edges.push(payload.edge);
			touch(workflow, payload.now);
		})
		.addCase(removeEdge, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.edges = workflow.edges.filter(e => e.id !== payload.edgeId);
			touch(workflow, payload.now);
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
			touch(workflow, payload.now);
		})
		.addCase(replaceGraph, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const replacement = applyGraphReplacement(workflow, payload.nodes, payload.edges);
			workflow.nodes = replacement.nodes;
			workflow.edges = replacement.edges;
			touch(workflow, payload.now);
		})
		.addCase(clearGraph, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes = workflow.nodes.filter(n => n.type === 'start');
			workflow.edges = [];
			touch(workflow, payload.now);
		})
		.addCase(removeWorkflowFromStore, (state, { payload }) => {
			delete state.workflows[payload];
		})
		.addCase(purgeRequestRefs, (state, { payload }) => {
			const dropped = new Set(payload.requestIds);
			if (dropped.size === 0) return;
			purgeRequestRefsFromWorkflows(state.workflows, dropped);
		});
}

/**
 * Stamp `updatedAt` on a workflow. Accepts the epoch-ms timestamp minted
 * at dispatch time (ADR 0005 §2) — falling back to `Date.now()` only
 * when the caller didn't supply one (legacy / test paths). Call at the
 * END of each case AFTER confirming a real mutation occurred; bypassed
 * when the case short-circuits as a no-op so identity equality stays
 * intact for the no-op tests.
 */
function touch(workflow: { updatedAt?: number }, now?: number): void {
	workflow.updatedAt = now ?? Date.now();
}
