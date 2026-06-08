import type { WorkflowFile } from './types';
import { findCycleNodes } from './workflow-graph-traversal';

export interface GraphHealth {
	/** Total nodes including the Start node. */
	nodeCount: number;
	/** Total edges. */
	edgeCount: number;
	/** Node ids reachable from the (single) Start node via outbound edges. */
	reachable: Set<string>;
	/** Nodes that exist but Start can't reach. Always excludes Start itself. */
	unreachable: string[];
	/** Edges that reference a node that no longer exists. */
	danglingEdges: string[];
	/** Request nodes with `requestId === null` (the user hasn't picked one). */
	unlinkedRequestNodes: string[];
	/**
	 * Node ids that participate in a directed cycle (each appears as both
	 * an ancestor and a descendant of itself). The orchestrator needs a
	 * loop node to bound iteration; raw cycles via plain edges run forever,
	 * so we surface them in the header pill.
	 */
	cycleNodes: string[];
}

/**
 * Graph-level health snapshot for the editor header. Pure walk over the
 * workflow file — no project tree needed; the "request not found" count
 * (which depends on the live tree) is computed separately in the editor.
 */
export function inspectGraph(workflow: WorkflowFile): GraphHealth {
	const nodeIds = new Set(workflow.nodes.map(n => n.id));
	const reachable = new Set<string>();
	const adjacency = new Map<string, string[]>();

	for (const e of workflow.edges) {
		if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
		const next = adjacency.get(e.source) ?? [];
		next.push(e.target);
		adjacency.set(e.source, next);
	}

	const start = workflow.nodes.find(n => n.type === 'start');
	if (start) {
		const stack = [start.id];
		while (stack.length > 0) {
			const id = stack.pop();
			if (!id || reachable.has(id)) continue;
			reachable.add(id);
			for (const next of adjacency.get(id) ?? []) stack.push(next);
		}
	}

	const unreachable: string[] = [];
	for (const node of workflow.nodes) {
		if (node.type === 'start') continue;
		// Comment nodes are pure documentation — they're *expected* to be
		// disconnected from Start, so they never count as unreachable.
		if (node.type === 'comment') continue;
		if (!reachable.has(node.id)) unreachable.push(node.id);
	}

	const danglingEdges: string[] = [];
	for (const e of workflow.edges) {
		if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) danglingEdges.push(e.id);
	}

	const unlinkedRequestNodes: string[] = [];
	for (const node of workflow.nodes) {
		if (node.type !== 'request') continue;
		const d = node.data as { requestId: string | null };
		if (!d.requestId) unlinkedRequestNodes.push(node.id);
	}

	return {
		nodeCount: workflow.nodes.length,
		edgeCount: workflow.edges.length,
		reachable,
		unreachable,
		danglingEdges,
		unlinkedRequestNodes,
		cycleNodes: findCycleNodes(
			adjacency,
			workflow.nodes.map(n => n.id),
		),
	};
}

/**
 * Longest path length (edge count) from any Start node to a leaf,
 * walking outbound edges. Returns 0 for a Start-only workflow,
 * Number.POSITIVE_INFINITY when a cycle is reachable from Start
 * (rather than looping forever).
 *
 * Useful as a "graph depth" stat in the dialog and as a future
 * heuristic for layout-pass spacing decisions.
 */
export function workflowDepth(workflow: WorkflowFile): number {
	const adjacency = new Map<string, string[]>();
	const nodeIds = new Set(workflow.nodes.map(n => n.id));
	for (const e of workflow.edges) {
		if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
		const next = adjacency.get(e.source) ?? [];
		next.push(e.target);
		adjacency.set(e.source, next);
	}
	const starts = workflow.nodes.filter(n => n.type === 'start').map(n => n.id);
	if (starts.length === 0) return 0;
	let best = 0;
	for (const root of starts) {
		// DFS-colour: WHITE not seen, GRAY on current path (cycle marker),
		// BLACK fully explored with memoised depth.
		const colour = new Map<string, 'gray' | 'black'>();
		const depthOf = new Map<string, number>();
		let cycleHit = false;
		function visit(id: string): number {
			const c = colour.get(id);
			if (c === 'gray') {
				cycleHit = true;
				return 0;
			}
			if (c === 'black') return depthOf.get(id) ?? 0;
			colour.set(id, 'gray');
			let maxChild = 0;
			for (const next of adjacency.get(id) ?? []) {
				const child = visit(next);
				if (child + 1 > maxChild) maxChild = child + 1;
			}
			colour.set(id, 'black');
			depthOf.set(id, maxChild);
			return maxChild;
		}
		const d = visit(root);
		if (cycleHit) return Number.POSITIVE_INFINITY;
		if (d > best) best = d;
	}
	return best;
}

/**
 * Nodes that participate in zero edges — neither inbound nor outbound.
 * Excludes the Start node by default since it's allowed to be alone.
 * Useful for the lint dialog as a "dead end" hint.
 */
export function findIsolatedNodes(workflow: WorkflowFile): string[] {
	const touched = new Set<string>();
	const nodeIds = new Set(workflow.nodes.map(n => n.id));
	for (const e of workflow.edges) {
		if (nodeIds.has(e.source)) touched.add(e.source);
		if (nodeIds.has(e.target)) touched.add(e.target);
	}
	const out: string[] = [];
	for (const node of workflow.nodes) {
		if (node.type === 'start') continue;
		if (touched.has(node.id)) continue;
		out.push(node.id);
	}
	return out;
}

/**
 * One-hop predecessors of a node. Filtered to existing edges
 * (dangling endpoints don't count) and de-duped (a node can't be its
 * own predecessor in the result set even if a self-loop exists).
 */
export function findSourcesOf(workflow: WorkflowFile, nodeId: string): string[] {
	const ids = new Set<string>();
	for (const e of workflow.edges) {
		if (e.target !== nodeId) continue;
		if (e.source === nodeId) continue; // skip self-loops
		ids.add(e.source);
	}
	return [...ids];
}

/**
 * One-hop successors of a node. Filtered to existing edges
 * (dangling endpoints don't count) and de-duped.
 */
export function findTargetsOf(workflow: WorkflowFile, nodeId: string): string[] {
	const ids = new Set<string>();
	for (const e of workflow.edges) {
		if (e.source !== nodeId) continue;
		if (e.target === nodeId) continue; // skip self-loops
		ids.add(e.target);
	}
	return [...ids];
}
