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
 * Tarjan-ish DFS that flags every node sitting on a directed cycle. Uses
 * a 3-state colour map (white/grey/black); a back-edge to a grey node
 * marks the entire grey stack frame for that path. Cheap O(V+E).
 */
function findCycleNodes(adjacency: Map<string, string[]>, allIds: ReadonlyArray<string>): string[] {
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

export interface ConnectionAttempt {
	source: string;
	target: string;
	sourceHandle?: string | null;
	targetHandle?: string | null;
}

/**
 * Reasons a connection attempt is rejected, used to tooltip the canvas
 * when xyflow says "no" so the user knows *why*.
 */
export type ConnectionRejection =
	| 'unknown-source'
	| 'unknown-target'
	| 'self-loop'
	| 'into-start'
	| 'comment-endpoint'
	| 'duplicate-edge';

/**
 * Validate a candidate edge before it's added to the graph. Catches the
 * mistakes that the slice's invariants don't (the reducer dedupes by id,
 * but xyflow synthesises an id when the user drags, so the dedupe key
 * isn't useful for a "same source/target/handle" check).
 */
export function validateConnection(
	workflow: WorkflowFile,
	attempt: ConnectionAttempt,
): { ok: true } | { ok: false; reason: ConnectionRejection } {
	const nodesById = new Map(workflow.nodes.map(n => [n.id, n]));
	if (!nodesById.has(attempt.source)) return { ok: false, reason: 'unknown-source' };
	if (!nodesById.has(attempt.target)) return { ok: false, reason: 'unknown-target' };
	if (attempt.source === attempt.target) return { ok: false, reason: 'self-loop' };
	const target = nodesById.get(attempt.target);
	const source = nodesById.get(attempt.source);
	if (target?.type === 'start') return { ok: false, reason: 'into-start' };
	// Comment nodes are pure documentation and don't render Handles, so we
	// also reject connections at the data layer for defence in depth.
	if (target?.type === 'comment' || source?.type === 'comment') return { ok: false, reason: 'comment-endpoint' };
	for (const e of workflow.edges) {
		if (
			e.source === attempt.source &&
			e.target === attempt.target &&
			(e.sourceHandle ?? null) === (attempt.sourceHandle ?? null) &&
			(e.targetHandle ?? null) === (attempt.targetHandle ?? null)
		) {
			return { ok: false, reason: 'duplicate-edge' };
		}
	}
	return { ok: true };
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
 * Pretty-print the workflow as JSON for clipboard export. The shape is
 * the on-disk schema verbatim — pasting it back via `parseImportedWorkflow`
 * produces an equivalent workflow with re-keyed ids.
 */
export function serializeForExport(workflow: WorkflowFile): string {
	return JSON.stringify(workflow, null, 2);
}

/**
 * Parse + re-id a workflow from clipboard JSON. The caller supplies an
 * id minter so the new workflow + its nodes / edges get fresh KSUIDs;
 * otherwise paste would collide with the source. Returns `{ ok: false }`
 * on parse error rather than throwing — the UI's paste flow surfaces
 * the reason in a toast.
 *
 * The actual Zod validation lives in the schema package; we accept the
 * shape loosely here and rely on the schema parse to enforce it.
 */
export interface ParseImportResult {
	ok: boolean;
	workflow?: WorkflowFile;
	reason?: string;
}

export function parseImportedWorkflow(
	json: string,
	mintId: (prefix: 'workflow' | 'node' | 'edge') => string,
	parseSchema: (raw: unknown) => WorkflowFile,
): ParseImportResult {
	let raw: unknown;
	try {
		raw = JSON.parse(json);
	} catch (err) {
		return { ok: false, reason: (err as Error).message };
	}
	let parsed: WorkflowFile;
	try {
		parsed = parseSchema(raw);
	} catch (err) {
		return { ok: false, reason: (err as Error).message };
	}
	// Re-key every id: workflow, every node, every edge (rewriting source/
	// target to the new node ids).
	const nodeIdMap = new Map<string, string>();
	const reKeyedNodes = parsed.nodes.map(node => {
		const newId = mintId('node');
		nodeIdMap.set(node.id, newId);
		return { ...node, id: newId };
	});
	const reKeyedEdges = parsed.edges.map(edge => ({
		...edge,
		id: mintId('edge'),
		source: nodeIdMap.get(edge.source) ?? edge.source,
		target: nodeIdMap.get(edge.target) ?? edge.target,
	}));
	const workflow: WorkflowFile = {
		...parsed,
		id: mintId('workflow'),
		nodes: reKeyedNodes,
		edges: reKeyedEdges,
	};
	return { ok: true, workflow };
}

export type NodeIssue = 'cycle' | 'unlinked' | 'unreachable';

/**
 * Compute the issue per node id from a GraphHealth snapshot — used by
 * the editor to decorate canvas pills with a red/amber ring. Ranking is
 * cycle > unlinked > unreachable so a single colour reflects the most
 * actionable problem (cycles can run forever, unlinked requests can't
 * fire, unreachable is the gentlest).
 */
export function nodeIssuesFromHealth(health: GraphHealth): Map<string, NodeIssue> {
	const issues = new Map<string, NodeIssue>();
	for (const id of health.unreachable) issues.set(id, 'unreachable');
	for (const id of health.unlinkedRequestNodes) issues.set(id, 'unlinked');
	for (const id of health.cycleNodes) issues.set(id, 'cycle');
	return issues;
}

/**
 * First node id with an issue, ranked cycle > unlinked > unreachable.
 * Returns `null` when the graph is clean. The WarningPill uses this to
 * jump-to-issue on click.
 */
export function firstIssueNode(health: GraphHealth): string | null {
	if (health.cycleNodes.length > 0) return health.cycleNodes[0];
	if (health.unlinkedRequestNodes.length > 0) return health.unlinkedRequestNodes[0];
	if (health.unreachable.length > 0) return health.unreachable[0];
	return null;
}

export interface NodeSearchResult {
	id: string;
	label: string;
	subtitle: string;
	kind: WorkflowNode['type'];
}

/**
 * Search the workflow's nodes by free-text query — used by the editor's
 * Cmd-K node finder. The "label" is whatever the user would recognise:
 * the linked request's name for request nodes (resolved by the caller —
 * we get it via the `requestNames` lookup, since pure helpers don't see
 * the project tree), trimmed comment text for comment nodes, and the
 * node kind otherwise.
 *
 * Returns nodes whose label OR kind contains the query (case-insensitive),
 * sorted by match position (prefix > substring) and tie-broken by label.
 */
export function searchNodes(
	workflow: WorkflowFile,
	query: string,
	requestNames: ReadonlyMap<string, string>,
): NodeSearchResult[] {
	const all = workflow.nodes.map(n => describeNodeForSearch(n, requestNames));
	const trimmed = query.trim().toLowerCase();
	if (trimmed === '') return all;
	const scored: { item: NodeSearchResult; score: number }[] = [];
	for (const item of all) {
		const labelLower = item.label.toLowerCase();
		const kindLower = item.kind.toLowerCase();
		const labelIdx = labelLower.indexOf(trimmed);
		const kindIdx = kindLower.indexOf(trimmed);
		const subtitleIdx = item.subtitle.toLowerCase().indexOf(trimmed);
		// Prefer label-prefix > label-substring > kind-substring > subtitle-substring.
		let score = -1;
		if (labelIdx === 0) score = 1000;
		else if (labelIdx > 0) score = 500 - labelIdx;
		else if (kindIdx >= 0) score = 200 - kindIdx;
		else if (subtitleIdx >= 0) score = 100 - subtitleIdx;
		if (score < 0) continue;
		scored.push({ item, score });
	}
	scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
	return scored.map(s => s.item);
}

function describeNodeForSearch(
	node: WorkflowNode,
	requestNames: ReadonlyMap<string, string>,
): NodeSearchResult {
	switch (node.type) {
		case 'start':
			return { id: node.id, label: 'Start', subtitle: 'Workflow entry point', kind: 'start' };
		case 'request': {
			const d = node.data as { requestId: string | null };
			const linked = d.requestId ? requestNames.get(d.requestId) : undefined;
			return {
				id: node.id,
				label: linked ?? 'Untitled request step',
				subtitle: linked ? 'Linked request' : 'No request linked',
				kind: 'request',
			};
		}
		case 'loop': {
			const d = node.data as { mode: 'count' | 'forEach'; count?: number };
			return {
				id: node.id,
				label: d.mode === 'count' ? `Loop ${d.count ?? 0}×` : 'Loop for each',
				subtitle: 'Loop',
				kind: 'loop',
			};
		}
		case 'condition': {
			const d = node.data as { operator?: string };
			return {
				id: node.id,
				label: `Condition (${d.operator ?? 'truthy'})`,
				subtitle: 'Condition',
				kind: 'condition',
			};
		}
		case 'notification': {
			const d = node.data as { title?: unknown[] };
			const title = previewValueSections(d.title) || 'Untitled notification';
			return { id: node.id, label: title, subtitle: 'Notification', kind: 'notification' };
		}
		case 'comment': {
			const d = node.data as { text?: string };
			const text = (d.text ?? '').trim();
			return {
				id: node.id,
				label: text || 'Empty note',
				subtitle: 'Comment',
				kind: 'comment',
			};
		}
	}
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
