import type { WorkflowFile, WorkflowNode } from './types';

/**
 * Per-node configuration warnings — softer than the GraphHealth issues
 * (cycle / unreachable / unlinked). These are "your node compiles but
 * won't run as you'd expect" cases: a Loop with count=0, a Condition
 * whose operator needs a right-hand side but doesn't have one, a
 * Notification with no title.
 *
 * Returned as a structured set so the UI can pick which to render,
 * and the QuickFixDialog can group them with the existing issues.
 */
export type NodeWarning =
	| { kind: 'loop-zero-count'; message: string }
	| { kind: 'notification-empty'; message: string }
	| { kind: 'condition-missing-right'; message: string }
	| { kind: 'comment-empty'; message: string };

export function validateNode(node: WorkflowNode): NodeWarning[] {
	switch (node.type) {
		case 'loop': {
			const d = node.data as { mode: 'count' | 'forEach'; count?: number };
			if (d.mode === 'count' && (d.count ?? 0) <= 0) {
				return [{ kind: 'loop-zero-count', message: 'Loop count is 0 — the body never runs.' }];
			}
			return [];
		}
		case 'notification': {
			const d = node.data as { title?: unknown[]; body?: unknown[] };
			const titleEmpty = !d.title || d.title.length === 0;
			const bodyEmpty = !d.body || d.body.length === 0;
			if (titleEmpty && bodyEmpty) {
				return [{ kind: 'notification-empty', message: 'Notification has no title or body — nothing will fire.' }];
			}
			return [];
		}
		case 'condition': {
			const d = node.data as { operator: string; right?: unknown[] };
			const needsRight = d.operator === 'equals' || d.operator === 'not_equals' || d.operator === 'contains';
			if (needsRight && (!d.right || d.right.length === 0)) {
				return [
					{
						kind: 'condition-missing-right',
						message: `Condition "${d.operator}" needs a right-hand value to compare against.`,
					},
				];
			}
			return [];
		}
		case 'comment': {
			const d = node.data as { text?: string };
			if (!d.text || d.text.trim() === '') {
				return [{ kind: 'comment-empty', message: 'Note is empty.' }];
			}
			return [];
		}
		default:
			return [];
	}
}

/**
 * Run `validateNode` across the workflow. Returns a Map<nodeId, NodeWarning[]>
 * keyed only on nodes that have at least one warning, so callers can do
 * `map.has(id)` for cheap presence checks.
 */
export function validateWorkflow(workflow: WorkflowFile): Map<string, NodeWarning[]> {
	const out = new Map<string, NodeWarning[]>();
	for (const node of workflow.nodes) {
		const warnings = validateNode(node);
		if (warnings.length > 0) out.set(node.id, warnings);
	}
	return out;
}
