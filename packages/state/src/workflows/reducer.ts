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
		})
		.addCase(actions.setWorkflowParent, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.parent = payload.parent;
		})
		.addCase(actions.addNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes.push(payload.node);
		})
		.addCase(actions.updateNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const idx = workflow.nodes.findIndex(n => n.id === payload.nodeId);
			if (idx === -1) return;
			workflow.nodes[idx] = { ...workflow.nodes[idx], ...payload.patch } as (typeof workflow.nodes)[number];
		})
		.addCase(actions.updateNodeData, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			// Cast through unknown — `data` shape is per-kind but the editor is
			// kind-aware and only passes valid keys for this node's kind.
			node.data = { ...node.data, ...payload.data } as typeof node.data;
		})
		.addCase(actions.moveNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			const node = workflow.nodes.find(n => n.id === payload.nodeId);
			if (!node) return;
			node.position = payload.position;
		})
		.addCase(actions.removeNode, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes = workflow.nodes.filter(n => n.id !== payload.nodeId);
			// Drop any edges touching the removed node — otherwise xyflow tries
			// to render an edge with a missing endpoint and crashes the canvas.
			workflow.edges = workflow.edges.filter(e => e.source !== payload.nodeId && e.target !== payload.nodeId);
		})
		.addCase(actions.addEdge, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			if (workflow.edges.some(e => e.id === payload.edge.id)) return;
			workflow.edges.push(payload.edge);
		})
		.addCase(actions.removeEdge, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.edges = workflow.edges.filter(e => e.id !== payload.edgeId);
		})
		.addCase(actions.replaceGraph, (state, { payload }) => {
			const workflow = state.workflows[payload.id];
			if (!workflow) return;
			workflow.nodes = payload.nodes;
			workflow.edges = payload.edges;
		})
		.addCase(actions.removeWorkflowFromStore, (state, { payload }) => {
			delete state.workflows[payload];
		});
}
