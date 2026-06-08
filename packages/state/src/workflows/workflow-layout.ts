import type { WorkflowFile, WorkflowNode } from './types';

export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 110;

/**
 * Deterministic placement for new nodes. We cascade down-right from the
 * existing centroid (or a sensible default) and snap to a grid; if the
 * candidate would overlap an existing node we step diagonally until we
 * find a clear slot. Pure + side-effect free so the canvas can call it
 * synchronously when the toolbar fires.
 */
export function placeNewNode(
	existing: ReadonlyArray<{ position: { x: number; y: number } }>,
	gridSize = 20,
): { x: number; y: number } {
	const start = existing.length === 0 ? { x: 280, y: 160 } : cascadeFrom(rightmost(existing), gridSize);

	let candidate = snap(start, gridSize);
	let safety = 64;
	while (safety-- > 0 && collides(candidate, existing)) {
		candidate = { x: candidate.x + gridSize * 2, y: candidate.y + gridSize * 2 };
	}
	return candidate;
}

function rightmost(existing: ReadonlyArray<{ position: { x: number; y: number } }>): { x: number; y: number } {
	let best = existing[0].position;
	for (const n of existing) {
		if (n.position.x > best.x || (n.position.x === best.x && n.position.y > best.y)) best = n.position;
	}
	return best;
}

function cascadeFrom(anchor: { x: number; y: number }, gridSize: number): { x: number; y: number } {
	return { x: anchor.x + NODE_WIDTH + gridSize, y: anchor.y };
}

function snap(p: { x: number; y: number }, gridSize: number): { x: number; y: number } {
	return { x: Math.round(p.x / gridSize) * gridSize, y: Math.round(p.y / gridSize) * gridSize };
}

function collides(
	p: { x: number; y: number },
	existing: ReadonlyArray<{ position: { x: number; y: number } }>,
): boolean {
	for (const n of existing) {
		const dx = Math.abs(p.x - n.position.x);
		const dy = Math.abs(p.y - n.position.y);
		if (dx < NODE_WIDTH && dy < NODE_HEIGHT) return true;
	}
	return false;
}

export interface NodeBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	width: number;
	height: number;
}

/**
 * Pure bounding-rectangle of a node set. Returns `null` for an empty
 * input so callers can short-circuit. Width/height assume node positions
 * are top-left corners — that matches xyflow's coordinate system.
 */
export function nodeBounds(nodes: ReadonlyArray<{ position: { x: number; y: number } }>): NodeBounds | null {
	if (nodes.length === 0) return null;
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	for (const n of nodes) {
		if (n.position.x < minX) minX = n.position.x;
		if (n.position.y < minY) minY = n.position.y;
		if (n.position.x > maxX) maxX = n.position.x;
		if (n.position.y > maxY) maxY = n.position.y;
	}
	return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Shift every node so the leftmost is at `margin.x` and the topmost is at
 * `margin.y`. Useful after a Tidy + manual drag session where the user
 * has pushed nodes off into negative space; saves them from manually
 * dragging the viewport back to origin.
 *
 * Pure + idempotent: calling twice on the same workflow produces the
 * same result (the second call shifts by zero). Returns the same
 * reference when there's nothing to shift.
 */
export function compactPositions(workflow: WorkflowFile, margin: { x: number; y: number } = { x: 40, y: 40 }): WorkflowFile {
	if (workflow.nodes.length === 0) return workflow;
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	for (const n of workflow.nodes) {
		if (n.position.x < minX) minX = n.position.x;
		if (n.position.y < minY) minY = n.position.y;
	}
	const dx = margin.x - minX;
	const dy = margin.y - minY;
	if (dx === 0 && dy === 0) return workflow;
	return {
		...workflow,
		nodes: workflow.nodes.map(n => ({
			...n,
			position: { x: n.position.x + dx, y: n.position.y + dy },
		})) as typeof workflow.nodes,
	};
}

export interface LayoutOptions {
	/** Pixels between successive ranks (left-to-right). Default 280 — clears NODE_WIDTH + a gutter. */
	rankSpacing?: number;
	/** Pixels between siblings within a rank (top-to-bottom). Default 140 — clears NODE_HEIGHT. */
	siblingSpacing?: number;
	/** Top-left anchor for the Start node. Default `{ x: 80, y: 120 }`. */
	origin?: { x: number; y: number };
}

/**
 * "Tidy graph" — BFS from Start, assign each node a rank by hop-count,
 * then lay out columns left-to-right with siblings stacked vertically.
 * Nodes that Start can't reach are appended in a tail rank so the user
 * can still see them (and hopefully wire them up).
 *
 * Returns a fresh `WorkflowFile` — the caller decides whether to dispatch
 * it via `replaceGraph`. Pure + deterministic for a given input order.
 */
export function autoLayout(workflow: WorkflowFile, options: LayoutOptions = {}): WorkflowFile {
	const rankSpacing = options.rankSpacing ?? 280;
	const siblingSpacing = options.siblingSpacing ?? 140;
	const origin = options.origin ?? { x: 80, y: 120 };

	const nodesById = new Map(workflow.nodes.map(n => [n.id, n]));
	const adjacency = new Map<string, string[]>();
	for (const e of workflow.edges) {
		if (!nodesById.has(e.source) || !nodesById.has(e.target)) continue;
		const next = adjacency.get(e.source) ?? [];
		next.push(e.target);
		adjacency.set(e.source, next);
	}

	const rankById = new Map<string, number>();
	const start = workflow.nodes.find(n => n.type === 'start');
	const queue: { id: string; rank: number }[] = [];
	if (start) queue.push({ id: start.id, rank: 0 });

	while (queue.length > 0) {
		const head = queue.shift();
		if (!head) break;
		const existing = rankById.get(head.id);
		if (existing !== undefined && existing <= head.rank) continue;
		rankById.set(head.id, head.rank);
		for (const target of adjacency.get(head.id) ?? []) queue.push({ id: target, rank: head.rank + 1 });
	}

	// Stash unreachable nodes (no Start, or Start can't get there) into a
	// tail rank that's at least one column right of the deepest reached
	// node, so they're visible without colliding with the main flow.
	const maxRank = rankById.size === 0 ? -1 : Math.max(...rankById.values());
	let tailRank = maxRank + 1;
	for (const n of workflow.nodes) {
		if (!rankById.has(n.id)) {
			rankById.set(n.id, tailRank);
			tailRank++;
		}
	}

	// Group by rank in insertion order so the layout is stable across runs
	// when the BFS is deterministic (we use Array#shift, not a set).
	const byRank = new Map<number, string[]>();
	for (const [id, rank] of rankById) {
		const bucket = byRank.get(rank) ?? [];
		bucket.push(id);
		byRank.set(rank, bucket);
	}

	const positions = new Map<string, { x: number; y: number }>();
	for (const [rank, ids] of byRank) {
		const x = origin.x + rank * rankSpacing;
		for (let i = 0; i < ids.length; i++) {
			positions.set(ids[i], { x, y: origin.y + i * siblingSpacing });
		}
	}

	return {
		...workflow,
		nodes: workflow.nodes.map(n => ({ ...n, position: positions.get(n.id) ?? n.position }) as WorkflowNode),
	};
}

/**
 * Re-key any node ids inside `node` so that a duplicated subgraph doesn't
 * collide with its source. The caller owns id generation — pass a
 * function so KSUIDs (which need a runtime side-effect to mint) stay out
 * of pure-helper land.
 */
export function cloneNodeAt(source: WorkflowNode, newId: string, position: { x: number; y: number }): WorkflowNode {
	return { ...source, id: newId, position } as WorkflowNode;
}
