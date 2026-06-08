import type { WorkflowEdge, WorkflowFile } from './types';
import type { GraphHealth } from './workflow-graph-analysis';
import { reachableFromNode } from './workflow-graph-traversal';

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
	| 'duplicate-edge'
	| 'would-create-cycle';

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
	// If adding source → target would mean target can reach back to source,
	// the new edge closes a cycle. Loop nodes are the orchestrator's
	// intended way to iterate; raw cycles via plain edges run forever.
	if (reachableFromNode(workflow, attempt.target).includes(attempt.source)) {
		return { ok: false, reason: 'would-create-cycle' };
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
 * Drop edges whose source or target node no longer exists. Used on
 * workflow open so files that drifted on disk (e.g. via merge conflict)
 * load cleanly — xyflow chokes on edges with missing endpoints.
 * Returns the same reference when nothing changed so React selectors
 * don't churn.
 */
export function cleanupDanglingEdges(workflow: WorkflowFile): WorkflowFile {
	const nodeIds = new Set(workflow.nodes.map(n => n.id));
	const kept = workflow.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
	if (kept.length === workflow.edges.length) return workflow;
	return { ...workflow, edges: kept };
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
