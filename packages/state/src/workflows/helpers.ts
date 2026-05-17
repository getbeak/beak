import type { RequestOverrides, WorkflowEdge, WorkflowFile, WorkflowNode } from './types';

/**
 * Pure helpers for the workflow editor. Live here in `@beak/state` rather
 * than the renderer because they're plain TypeScript with no React/Redux —
 * easier to test and the rules apply uniformly across the editor canvas,
 * the properties panel, and (eventually) the flight orchestrator.
 */

/**
 * Flatten value-sections into a string for canvas previews. RTV chips
 * collapse to `{var}` so the pill never explodes on a templated URL.
 */
export function previewValueSections(parts: unknown[] | undefined): string {
	if (!parts) return '';
	return parts.map(p => (typeof p === 'string' ? p : '{var}')).join('');
}

/**
 * Read the plain-string portion of a value-sections array — used by the
 * panel's <Input>/<Textarea> editors that only author plain text for now.
 * RTV-typed parts collapse to "" so a round-trip through this reader is
 * lossless for plain-text payloads.
 */
export function readPlainText(value: unknown): string {
	if (!Array.isArray(value)) return '';
	return value.filter((v): v is string => typeof v === 'string').join('');
}

/**
 * Count override slots that the user actually touched. A slot with neither
 * `value` nor `enabled` set is a pass-through and shouldn't count toward
 * the badge.
 */
export function countOverrideEntries(record?: Record<string, { value?: unknown; enabled?: boolean }>): number {
	if (!record) return 0;
	let n = 0;
	for (const r of Object.values(record)) {
		if (r.value !== undefined || r.enabled !== undefined) n++;
	}
	return n;
}

/**
 * Compact badge label shown on a request node's canvas pill — summarises
 * the override slots touched. Returns `null` when nothing's overridden so
 * the badge can be hidden entirely.
 */
export function overrideBadgeText(overrides?: RequestOverrides): string | null {
	if (!overrides) return null;
	const parts: string[] = [];
	const headers = countOverrideEntries(overrides.headers);
	const query = countOverrideEntries(overrides.query);
	const bodyFields = countOverrideEntries(overrides.body?.fields);
	const bodyRaw = Boolean(
		overrides.body?.raw && (overrides.body.raw.contentType || (overrides.body.raw.text?.length ?? 0) > 0),
	);
	if (headers > 0) parts.push(`${headers}h`);
	if (query > 0) parts.push(`${query}q`);
	if (bodyFields > 0 || bodyRaw) parts.push('body');
	if (overrides.fragment && overrides.fragment.length > 0) parts.push('frag');
	return parts.length === 0 ? null : parts.join(' · ');
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 110;

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
	const start = existing.length === 0
		? { x: 280, y: 160 }
		: cascadeFrom(rightmost(existing), gridSize);

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
	};
}

/**
 * Filter the edges to those touching neither end of the given node id.
 * Mirrors the reducer's cascade-delete logic; exposed for callers that
 * need to compute the post-removal edge set without dispatching.
 */
export function edgesAfterNodeRemoval(edges: ReadonlyArray<WorkflowEdge>, nodeId: string): WorkflowEdge[] {
	return edges.filter(e => e.source !== nodeId && e.target !== nodeId);
}

/**
 * Re-key any node ids inside `node` so that a duplicated subgraph doesn't
 * collide with its source. The caller owns id generation — pass a
 * function so KSUIDs (which need a runtime side-effect to mint) stay out
 * of pure-helper land.
 */
export function cloneNodeAt(
	source: WorkflowNode,
	newId: string,
	position: { x: number; y: number },
): WorkflowNode {
	return { ...source, id: newId, position } as WorkflowNode;
}
