import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from './actions';
import type { WorkflowsState } from './types';

/**
 * Attaches the pure workflows reducer cases to the given builder. The
 * builder's state type only needs to be a subtype of WorkflowsState — UI
 * packages compose this into a wider state shape with file-watch coordination
 * fields. Every mutating case guards the target workflow first so a stale
 * edit arriving after delete is a no-op rather than a crash.
 */
export function buildWorkflowsReducer<S extends WorkflowsState>(builder: ActionReducerMapBuilder<S>) {
	builder
		.addCase(actions.startWorkflows, state => {
			state.loaded = false;
		})
		.addCase(actions.workflowsOpened, (state, { payload }) => {
			state.workflows = payload.workflows;
			state.loaded = true;
		})
		.addCase(actions.insertNewWorkflow, (state, { payload }) => {
			state.workflows[payload.id] = payload.workflow;
		})
		.addCase(actions.updateWorkflowName, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.name = payload.name;
			touch(workflow);
		})
		.addCase(actions.updateWorkflowDescription, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const trimmed = payload.description?.trim();
			if (trimmed) workflow.description = trimmed;
			else delete workflow.description;
			touch(workflow);
		})
		.addCase(actions.setWorkflowTags, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			// Normalise: trim, lowercase, dedupe, drop empties — so the file
			// stays canonical and search works the way the user expects.
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
		.addCase(actions.setWorkflowParent, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.parent = payload.parent;
			touch(workflow);
		})
		.addCase(actions.addNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes.push(payload.node);
			touch(workflow);
		})
		.addCase(actions.updateNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const idx = workflow.nodes.findIndex(n => n.id === payload.nodeId);
			if (idx === -1) return;
			workflow.nodes[idx] = { ...workflow.nodes[idx], ...payload.patch } as (typeof workflow.nodes)[number];
			touch(workflow);
		})
		.addCase(actions.updateNodeData, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			// Cast through unknown — `data` shape is per-kind but the editor is
			// kind-aware and only passes valid keys for this node's kind.
			node.data = { ...node.data, ...payload.data } as typeof node.data;
			touch(workflow);
		})
		.addCase(actions.moveNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			node.position = payload.position;
			touch(workflow);
		})
		.addCase(actions.renameNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			const trimmed = payload.name?.trim();
			if (trimmed) (node as { name?: string }).name = trimmed;
			else delete (node as { name?: string }).name;
			touch(workflow);
		})
		.addCase(actions.removeNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes = workflow.nodes.filter(n => n.id !== payload.nodeId);
			// Drop any edges touching the removed node — otherwise xyflow tries
			// to render an edge with a missing endpoint and crashes the canvas.
			workflow.edges = workflow.edges.filter(e => e.source !== payload.nodeId && e.target !== payload.nodeId);
			touch(workflow);
		})
		.addCase(actions.removeNodes, (state, { payload }) => {
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
		})
		.addCase(actions.duplicateNode, (state, { payload }) => {
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
			const cloned = {
				...source,
				id: payload.newNodeId,
				position: payload.position,
				data: JSON.parse(JSON.stringify(source.data)),
			} as (typeof workflow.nodes)[number];
			workflow.nodes.push(cloned);
			touch(workflow);
		})
		.addCase(actions.addEdge, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			if (workflow.edges.some(e => e.id === payload.edge.id)) return;
			workflow.edges.push(payload.edge);
			touch(workflow);
		})
		.addCase(actions.removeEdge, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.edges = workflow.edges.filter(e => e.id !== payload.edgeId);
			touch(workflow);
		})
		.addCase(actions.updateEdgeLabel, (state, { payload }) => {
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
		})
		.addCase(actions.replaceGraph, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes = payload.nodes;
			workflow.edges = payload.edges;
			touch(workflow);
		})
		.addCase(actions.clearGraph, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			// Keep the Start node so the workflow always has an entry point.
			workflow.nodes = workflow.nodes.filter(n => n.type === 'start');
			workflow.edges = [];
			touch(workflow);
		})
		.addCase(actions.removeWorkflowFromStore, (state, { payload }) => {
			delete state.workflows[payload];
		})
		.addCase(actions.purgeRequestRefs, (state, { payload }) => {
			// Project tree just dropped these requests — clear every request
			// node's `data.requestId` that still points at one. Editors then
			// render the canonical "Pick a request →" empty state instead of
			// a dangling id; the workflow file will rewrite on next save.
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
	workflow.updatedAt = Date.now();
}
