import { connectedComponents } from './helpers';
import type { WorkflowFile, WorkflowNodeKind } from './types';

/**
 * Pure stats summary for the Workflow > Stats dialog. Aggregates every
 * countable number on the file into one shape so the renderer can pick
 * what to display without re-walking the graph N times.
 */
export interface WorkflowStats {
	/** Per-kind node counts. Always includes every WorkflowNodeKind, even at 0. */
	nodesByKind: Record<WorkflowNodeKind, number>;
	/** Total edges. */
	edgeCount: number;
	/** Edge counts grouped by sourceHandle name ('body' | 'after' | 'true' | 'false' | '' for unhandled). */
	edgesByHandle: Record<string, number>;
	/** Connected component count (excludes comments). */
	componentCount: number;
	/** Request nodes linked to a tree request id (vs. unlinked placeholders). */
	linkedRequestCount: number;
	/** Number of request nodes with `requestId === null`. */
	unlinkedRequestCount: number;
}

export function workflowStats(workflow: WorkflowFile): WorkflowStats {
	const nodesByKind: Record<WorkflowNodeKind, number> = {
		start: 0,
		request: 0,
		loop: 0,
		condition: 0,
		notification: 0,
		comment: 0,
	};
	let linkedRequestCount = 0;
	let unlinkedRequestCount = 0;
	for (const node of workflow.nodes) {
		nodesByKind[node.type] += 1;
		if (node.type === 'request') {
			const d = node.data as { requestId: string | null };
			if (d.requestId) linkedRequestCount += 1;
			else unlinkedRequestCount += 1;
		}
	}

	const edgesByHandle: Record<string, number> = {};
	for (const edge of workflow.edges) {
		const key = edge.sourceHandle ?? '';
		edgesByHandle[key] = (edgesByHandle[key] ?? 0) + 1;
	}

	return {
		nodesByKind,
		edgeCount: workflow.edges.length,
		edgesByHandle,
		componentCount: connectedComponents(workflow).length,
		linkedRequestCount,
		unlinkedRequestCount,
	};
}
