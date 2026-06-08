import type { WorkflowFile } from './types';

/**
 * Tarjan-ish DFS that flags every node sitting on a directed cycle. Uses
 * a 3-state colour map (white/grey/black); a back-edge to a grey node
 * marks the entire grey stack frame for that path. Cheap O(V+E).
 *
 * Exported so that execution helpers (`flightFromNode`) and health checks
 * (`inspectGraph`) can reuse it without duplicating the algorithm.
 */
export function findCycleNodes(adjacency: Map<string, string[]>, allIds: ReadonlyArray<string>): string[] {
	const GREY = 1;
	const BLACK = 2;
	const colour = new Map<string, number>();
	const onCycle = new Set<string>();
	const stack: string[] = [];

	for (const id of allIds) {
		if (colour.get(id) !== undefined) continue;
		const todo: { id: string; childIdx: number }[] = [{ id, childIdx: 0 }];
		colour.set(id, GREY);
		stack.push(id);
		while (todo.length > 0) {
			const top = todo[todo.length - 1];
			const children = adjacency.get(top.id) ?? [];
			if (top.childIdx >= children.length) {
				colour.set(top.id, BLACK);
				todo.pop();
				stack.pop();
				continue;
			}
			const child = children[top.childIdx++];
			const c = colour.get(child);
			if (c === GREY) {
				// Back edge — mark the whole grey chain from `child` up to top.
				let captured = false;
				for (const n of stack) {
					if (n === child) captured = true;
					if (captured) onCycle.add(n);
				}
			} else if (c === undefined) {
				colour.set(child, GREY);
				stack.push(child);
				todo.push({ id: child, childIdx: 0 });
			}
		}
	}

	// Sort for deterministic test/assertion output.
	return [...onCycle].sort();
}

/**
 * BFS reachability from Start, broken out so the orchestrator (and unit
 * tests) can call it without paying for the full health snapshot. Returns
 * the node id set in insertion order so callers that want a deterministic
 * walk get one.
 */
export function reachableFromStart(workflow: WorkflowFile): string[] {
	const nodeIds = new Set(workflow.nodes.map(n => n.id));
	const adjacency = new Map<string, string[]>();
	for (const e of workflow.edges) {
		if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
		const next = adjacency.get(e.source) ?? [];
		next.push(e.target);
		adjacency.set(e.source, next);
	}
	const start = workflow.nodes.find(n => n.type === 'start');
	if (!start) return [];

	const seen = new Set<string>();
	const order: string[] = [];
	const queue: string[] = [start.id];
	while (queue.length > 0) {
		const id = queue.shift();
		if (!id || seen.has(id)) continue;
		seen.add(id);
		order.push(id);
		for (const next of adjacency.get(id) ?? []) queue.push(next);
	}
	return order;
}

/**
 * BFS reachability from an arbitrary node id. Mirrors `reachableFromStart`
 * but lets a caller anchor on any node — used by run-from-here to compute
 * the partial walk and by tests that need to scope a slice of the graph.
 */
export function reachableFromNode(workflow: WorkflowFile, anchorId: string): string[] {
	const nodeIds = new Set(workflow.nodes.map(n => n.id));
	if (!nodeIds.has(anchorId)) return [];
	const adjacency = new Map<string, string[]>();
	for (const e of workflow.edges) {
		if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
		const next = adjacency.get(e.source) ?? [];
		next.push(e.target);
		adjacency.set(e.source, next);
	}
	const seen = new Set<string>();
	const order: string[] = [];
	const queue: string[] = [anchorId];
	while (queue.length > 0) {
		const id = queue.shift();
		if (!id || seen.has(id)) continue;
		seen.add(id);
		order.push(id);
		for (const next of adjacency.get(id) ?? []) queue.push(next);
	}
	return order;
}

/**
 * Group nodes into weakly-connected components — two nodes are in the
 * same component if there's a path between them via edges in either
 * direction. Comments are intentionally excluded since they're never
 * wired into the main flow. Output is component sets in node-insertion
 * order so tests / UI get a deterministic ordering.
 *
 * Useful as a "what does the workflow actually contain?" surface — a
 * graph with 3 components is probably 3 independent flows pasted into
 * one file, not a single coherent workflow.
 */
export function connectedComponents(workflow: WorkflowFile): string[][] {
	const eligible = workflow.nodes.filter(n => n.type !== 'comment');
	const nodeIds = new Set(eligible.map(n => n.id));
	const undirected = new Map<string, Set<string>>();
	for (const n of eligible) undirected.set(n.id, new Set());
	for (const e of workflow.edges) {
		if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
		undirected.get(e.source)?.add(e.target);
		undirected.get(e.target)?.add(e.source);
	}

	const seen = new Set<string>();
	const components: string[][] = [];
	for (const node of eligible) {
		if (seen.has(node.id)) continue;
		const stack = [node.id];
		const component: string[] = [];
		while (stack.length > 0) {
			const id = stack.pop();
			if (!id || seen.has(id)) continue;
			seen.add(id);
			component.push(id);
			for (const next of undirected.get(id) ?? []) stack.push(next);
		}
		components.push(component);
	}
	return components;
}
