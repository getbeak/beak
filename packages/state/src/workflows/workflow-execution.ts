import type { WorkflowFile } from './types';
import { findCycleNodes, reachableFromNode, reachableFromStart } from './workflow-graph-traversal';

/**
 * Topological order over the slice reachable from a non-Start anchor —
 * the "run from here" walk. Skips Start and anything upstream of the
 * anchor; cycles in the slice throw, same as `topologicalOrder`.
 *
 * If the caller passes the Start node, this collapses to
 * `topologicalOrder(workflow)`.
 */
export function flightFromNode(workflow: WorkflowFile, anchorId: string): string[] {
	const reachable = new Set(reachableFromNode(workflow, anchorId));
	if (reachable.size === 0) return [];

	const adjacency = new Map<string, string[]>();
	for (const e of workflow.edges) {
		if (!reachable.has(e.source) || !reachable.has(e.target)) continue;
		const next = adjacency.get(e.source) ?? [];
		next.push(e.target);
		adjacency.set(e.source, next);
	}

	// Detect cycles in the slice up-front via DFS colouring — Kahn's
	// in-degree accounting can be fooled when we force the anchor to run
	// first (a backedge into the anchor still leaves the slice cyclic).
	if (findCycleNodes(adjacency, [...reachable]).length > 0) {
		throw new Error('flightFromNode: slice contains a directed cycle');
	}

	// Now safely Kahn. Compute in-degrees within the slice; the anchor
	// might have inbound edges from upstream (outside the slice) which we
	// already filtered out via `reachable`. Anchor is guaranteed to have
	// in-degree 0 here so it leads.
	const inDegree = new Map<string, number>();
	for (const id of reachable) inDegree.set(id, 0);
	for (const e of workflow.edges) {
		if (!reachable.has(e.source) || !reachable.has(e.target)) continue;
		inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
	}

	const ready: string[] = [];
	for (const [id, degree] of inDegree) if (degree === 0) ready.push(id);
	// Anchor leads — surface it first even if Kahn would otherwise tie.
	ready.sort((a, b) => (a === anchorId ? -1 : b === anchorId ? 1 : 0));

	const order: string[] = [];
	while (ready.length > 0) {
		const id = ready.shift()!;
		order.push(id);
		for (const next of adjacency.get(id) ?? []) {
			const remaining = (inDegree.get(next) ?? 0) - 1;
			inDegree.set(next, remaining);
			if (remaining === 0) ready.push(next);
		}
	}
	return order;
}

/**
 * Kahn's algorithm — emits the workflow's nodes in topological order
 * starting from Start, suitable for sequential orchestration. Throws when
 * the graph contains a directed cycle (which the editor surfaces in the
 * WarningPill before the user ever hits "run").
 *
 * Only considers nodes reachable from Start; unreachable nodes never
 * appear in the result, since the orchestrator will skip them anyway.
 */
export function topologicalOrder(workflow: WorkflowFile): string[] {
	const reachable = new Set(reachableFromStart(workflow));
	const inDegree = new Map<string, number>();
	const adjacency = new Map<string, string[]>();
	for (const id of reachable) inDegree.set(id, 0);
	for (const e of workflow.edges) {
		if (!reachable.has(e.source) || !reachable.has(e.target)) continue;
		const next = adjacency.get(e.source) ?? [];
		next.push(e.target);
		adjacency.set(e.source, next);
		inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
	}

	const ready: string[] = [];
	for (const [id, degree] of inDegree) if (degree === 0) ready.push(id);

	const order: string[] = [];
	while (ready.length > 0) {
		const id = ready.shift()!;
		order.push(id);
		for (const next of adjacency.get(id) ?? []) {
			const remaining = (inDegree.get(next) ?? 0) - 1;
			inDegree.set(next, remaining);
			if (remaining === 0) ready.push(next);
		}
	}

	if (order.length !== reachable.size) {
		throw new Error('topologicalOrder: workflow contains a directed cycle');
	}
	return order;
}
