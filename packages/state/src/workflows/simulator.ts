import { previewValueSections } from './helpers';
import type { WorkflowEdge, WorkflowFile, WorkflowNode } from './types';

/**
 * Pure simulator that walks a workflow emitting events. Doesn't run real
 * HTTP requests — it asks the caller for outputs via a resolver (so the
 * orchestrator UI can be developed and tested before the runtime lands).
 *
 * The events are a faithful narration of what the real orchestrator
 * should do: enter-node, condition-evaluated, loop-iteration,
 * edge-followed, exit-node, completed. Tests assert on the event log;
 * UI code consumes it via a listener-style callback.
 *
 * Lives in @beak/state (not @beak/ui) so the runtime, the renderer's
 * "simulate" preview, and the test suite all share one implementation
 * of "what would running this look like?"
 */

export type SimulationEvent =
	| { type: 'workflow-start'; workflowId: string }
	| { type: 'enter-node'; nodeId: string; kind: WorkflowNode['type'] }
	| { type: 'exit-node'; nodeId: string }
	| { type: 'edge-followed'; edgeId: string; from: string; to: string }
	| { type: 'condition-evaluated'; nodeId: string; branch: 'true' | 'false' }
	| { type: 'loop-iteration'; nodeId: string; index: number }
	| { type: 'request-skipped'; nodeId: string; reason: 'unlinked' }
	| { type: 'request-completed'; nodeId: string; output: unknown }
	| { type: 'notification-fired'; nodeId: string; title: string }
	| { type: 'comment-skipped'; nodeId: string }
	| { type: 'workflow-complete'; workflowId: string }
	| { type: 'workflow-aborted'; workflowId: string; reason: string };

export interface SimulationContext {
	/**
	 * Caller-supplied evaluator for condition nodes — returns true/false
	 * given the node and the most recent upstream output. The simulator
	 * doesn't have access to real RTV data so the orchestrator UI / test
	 * passes whatever decision flow it wants to model.
	 */
	evaluateCondition?: (node: Extract<WorkflowNode, { type: 'condition' }>) => boolean;
	/**
	 * Pretend-run output for a request node — the orchestrator UI hands in
	 * a fake response; tests assert based on whatever the test provides.
	 * Returning `undefined` is fine; the simulator just doesn't pass
	 * anything to downstream nodes.
	 */
	runRequest?: (node: Extract<WorkflowNode, { type: 'request' }>) => unknown;
	/**
	 * Per-loop iteration count when mode === 'count'. The simulator
	 * defaults to `data.count ?? 0` if the resolver is omitted.
	 */
	loopIterations?: (node: Extract<WorkflowNode, { type: 'loop' }>) => number;
	/** Safety cap so accidental cycles can't run forever. Default 10_000. */
	maxSteps?: number;
}

/**
 * Walk the workflow from Start, emitting `SimulationEvent`s. Cycles
 * cap out at `maxSteps`; if hit, the simulator aborts cleanly with a
 * `workflow-aborted` event rather than blowing the call stack.
 *
 * The walk is deterministic for a given `SimulationContext` — useful
 * for snapshot-style tests in the renderer.
 */
export function walkWorkflow(workflow: WorkflowFile, context: SimulationContext = {}): SimulationEvent[] {
	const events: SimulationEvent[] = [];
	const maxSteps = context.maxSteps ?? 10_000;

	const start = workflow.nodes.find(n => n.type === 'start');
	if (!start) {
		events.push({ type: 'workflow-aborted', workflowId: workflow.id, reason: 'no Start node' });
		return events;
	}

	const adjacency = buildAdjacency(workflow);
	const nodesById = new Map(workflow.nodes.map(n => [n.id, n]));

	events.push({ type: 'workflow-start', workflowId: workflow.id });

	let steps = 0;
	let aborted = false;
	function follow(nodeId: string) {
		if (aborted) return;
		if (steps++ >= maxSteps) {
			events.push({ type: 'workflow-aborted', workflowId: workflow.id, reason: 'max steps exceeded' });
			aborted = true;
			return;
		}
		const node = nodesById.get(nodeId);
		if (!node) return;

		events.push({ type: 'enter-node', nodeId, kind: node.type });

		switch (node.type) {
			case 'start': {
				followAllOutbound(nodeId);
				break;
			}
			case 'request': {
				const d = node.data as { requestId: string | null };
				if (!d.requestId) {
					events.push({ type: 'request-skipped', nodeId, reason: 'unlinked' });
				} else {
					const output = context.runRequest?.(node as Extract<WorkflowNode, { type: 'request' }>);
					events.push({ type: 'request-completed', nodeId, output });
				}
				followAllOutbound(nodeId);
				break;
			}
			case 'loop': {
				const loop = node as Extract<WorkflowNode, { type: 'loop' }>;
				const iterations = context.loopIterations?.(loop) ?? (loop.data.count ?? 0);
				for (let i = 0; i < iterations; i++) {
					if (aborted) break;
					events.push({ type: 'loop-iteration', nodeId, index: i });
					followBranch(nodeId, 'body');
				}
				// After the loop, take the `after` branch (or default outbound
				// if no labelled handles are wired).
				if (!aborted) followBranch(nodeId, 'after');
				break;
			}
			case 'condition': {
				const cond = node as Extract<WorkflowNode, { type: 'condition' }>;
				const result = context.evaluateCondition ? context.evaluateCondition(cond) : false;
				events.push({ type: 'condition-evaluated', nodeId, branch: result ? 'true' : 'false' });
				followBranch(nodeId, result ? 'true' : 'false');
				break;
			}
			case 'notification': {
				const notif = node as Extract<WorkflowNode, { type: 'notification' }>;
				const title = previewValueSections(notif.data.title) || 'Untitled notification';
				events.push({ type: 'notification-fired', nodeId, title });
				followAllOutbound(nodeId);
				break;
			}
			case 'comment': {
				events.push({ type: 'comment-skipped', nodeId });
				// Comments shouldn't have outbound edges (validateConnection
				// rejects them), but be defensive.
				followAllOutbound(nodeId);
				break;
			}
		}

		if (!aborted) events.push({ type: 'exit-node', nodeId });
	}

	function followAllOutbound(nodeId: string) {
		for (const e of adjacency.get(nodeId) ?? []) {
			if (aborted) return;
			events.push({ type: 'edge-followed', edgeId: e.id, from: e.source, to: e.target });
			follow(e.target);
		}
	}

	function followBranch(nodeId: string, handle: string) {
		const outbound = adjacency.get(nodeId) ?? [];
		// Prefer labelled handles, but fall back to bare edges if no labelled
		// edge matches — keeps demo workflows simple (the user can wire
		// without picking a handle if they only want one branch).
		const labelled = outbound.filter(e => e.sourceHandle === handle);
		const target = labelled.length > 0 ? labelled : outbound.filter(e => !e.sourceHandle);
		for (const e of target) {
			if (aborted) return;
			events.push({ type: 'edge-followed', edgeId: e.id, from: e.source, to: e.target });
			follow(e.target);
		}
	}

	follow(start.id);
	if (!aborted) {
		events.push({ type: 'workflow-complete', workflowId: workflow.id });
	}
	return events;
}

function buildAdjacency(workflow: WorkflowFile): Map<string, WorkflowEdge[]> {
	const nodeIds = new Set(workflow.nodes.map(n => n.id));
	const adjacency = new Map<string, WorkflowEdge[]>();
	for (const e of workflow.edges) {
		if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
		const next = adjacency.get(e.source) ?? [];
		next.push(e);
		adjacency.set(e.source, next);
	}
	return adjacency;
}
