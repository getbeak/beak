import type { WorkflowEdge, WorkflowFile, WorkflowNode } from './types';

/**
 * Return a new `{ nodes, edges }` pair for a `replaceGraph` action.
 *
 * Callers (layout auto-arrange, OpenAPI import) own the new arrays; this
 * helper exists as a named extraction point so the operation is traceable
 * and testable in isolation.
 *
 * Pure — returns a plain object; does not mutate `workflow`.
 */
export function applyGraphReplacement(
	_workflow: WorkflowFile,
	nodes: WorkflowNode[],
	edges: WorkflowEdge[],
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
	return { nodes, edges };
}

/**
 * Sweep every workflow in the record and set `data.requestId` to `null` on
 * any `request` node whose id appears in `droppedIds`.
 *
 * Mutates the `workflows` object in-place (Immer-draft safe). Used from
 * Immer reducers where direct mutation is the idiomatic pattern.
 *
 * Pure in the sense that it takes all inputs as parameters and has no
 * dependency on external state or time — the mutation it performs is
 * deterministic given the same inputs.
 */
export function purgeRequestRefsFromWorkflows(
	workflows: Record<string, WorkflowFile>,
	droppedIds: Set<string>,
): void {
	for (const workflow of Object.values(workflows)) {
		for (const node of workflow.nodes) {
			if (node.type !== 'request') continue;
			const d = node.data as { requestId: string | null };
			if (d.requestId && droppedIds.has(d.requestId)) {
				d.requestId = null;
			}
		}
	}
}
