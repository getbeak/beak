import { createReducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import * as actions from '../actions';
import { cleanupDanglingEdges, inspectGraph, searchNodes, validateConnection } from '../helpers';
import { validateWorkflow } from '../validation';
import { buildWorkflowsReducer } from '../reducer';
import { instantiateTemplate } from '../templates';
import { initialWorkflowsState, type WorkflowsState } from '../types';

/**
 * End-to-end scenarios over the pure workflow slice. These mirror the
 * sequences a user actually performs in the editor (build → connect →
 * tweak → delete) and assert the composed reducer state matches at every
 * step.
 *
 * If a reducer rule ever drifts (e.g. addEdge stops dedupe-ing, removeNode
 * stops cascading), these are the tests that surface it loudly.
 */

const reducer = createReducer<WorkflowsState>(initialWorkflowsState, builder => {
	buildWorkflowsReducer(builder);
});

function counterMinter() {
	const counts: Record<string, number> = {};
	return (prefix: 'workflow' | 'node' | 'edge') => {
		counts[prefix] = (counts[prefix] ?? 0) + 1;
		return `${prefix}-${counts[prefix]}`;
	};
}

describe('workflow lifecycle — build and tear down', () => {
	it('round-trips a typical authoring session', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'blank', name: 'flow', mintId: mint });
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));
		expect(state.workflows[seed.id]!.nodes.map(n => n.type)).toEqual(['start']);

		// Add a request, a loop, a notification.
		const startId = seed.nodes[0].id;
		state = reducer(
			state,
			actions.addNode({
				id: seed.id,
				node: { id: 'r1', type: 'request', position: { x: 360, y: 120 }, data: { requestId: 'req-a' } },
			}),
		);
		state = reducer(
			state,
			actions.addNode({
				id: seed.id,
				node: {
					id: 'l1',
					type: 'loop',
					position: { x: 640, y: 120 },
					data: { mode: 'count', count: 3 },
				},
			}),
		);
		state = reducer(
			state,
			actions.addNode({
				id: seed.id,
				node: { id: 'n1', type: 'notification', position: { x: 880, y: 120 }, data: {} },
			}),
		);
		// Wire them up.
		state = reducer(state, actions.addEdge({ id: seed.id, edge: { id: 'e1', source: startId, target: 'r1' } }));
		state = reducer(state, actions.addEdge({ id: seed.id, edge: { id: 'e2', source: 'r1', target: 'l1' } }));
		state = reducer(
			state,
			actions.addEdge({ id: seed.id, edge: { id: 'e3', source: 'l1', target: 'n1', sourceHandle: 'body' } }),
		);

		// Health check: no warnings, no cycles.
		let wf = state.workflows[seed.id]!;
		let health = inspectGraph(wf);
		expect(health.unreachable).toEqual([]);
		expect(health.unlinkedRequestNodes).toEqual([]);
		expect(health.cycleNodes).toEqual([]);
		expect(health.reachable.size).toBe(4);

		// Tweak the loop count.
		state = reducer(state, actions.updateNodeData({ id: seed.id, nodeId: 'l1', data: { count: 9 } }));
		wf = state.workflows[seed.id]!;
		const loopNode = wf.nodes.find(n => n.id === 'l1')!;
		expect((loopNode.data as { count: number }).count).toBe(9);

		// Bulk delete the loop + notification — request stays.
		state = reducer(state, actions.removeNodes({ id: seed.id, nodeIds: ['l1', 'n1'] }));
		wf = state.workflows[seed.id]!;
		expect(wf.nodes.map(n => n.id).sort()).toEqual(['r1', startId].sort());
		// e2 (r1→l1) and e3 (l1→n1) cascade-dropped; only e1 remains.
		expect(wf.edges.map(e => e.id)).toEqual(['e1']);
		health = inspectGraph(wf);
		expect(health.unreachable).toEqual([]);
		expect(health.cycleNodes).toEqual([]);
	});

	it('rejects invalid wires before they reach the reducer', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'smoke-test', name: 'flow', mintId: mint });
		const state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));
		const wf = state.workflows[seed.id]!;
		const start = wf.nodes.find(n => n.type === 'start')!;
		const req = wf.nodes.find(n => n.type === 'request')!;

		// Self-loop on the request — should be rejected at the validator.
		expect(validateConnection(wf, { source: req.id, target: req.id })).toEqual({ ok: false, reason: 'self-loop' });
		// Connection into Start — rejected.
		expect(validateConnection(wf, { source: req.id, target: start.id })).toEqual({ ok: false, reason: 'into-start' });
	});

	it('survives a duplicate-then-delete-original cycle', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'auth-chain', name: 'flow', mintId: mint });
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));
		const before = state.workflows[seed.id]!.nodes;
		const sourceReq = before.find(n => n.type === 'request')!;

		state = reducer(
			state,
			actions.duplicateNode({
				id: seed.id,
				sourceNodeId: sourceReq.id,
				newNodeId: 'r-clone',
				position: { x: 999, y: 999 },
			}),
		);
		expect(state.workflows[seed.id]!.nodes.find(n => n.id === 'r-clone')).toBeDefined();

		state = reducer(state, actions.removeNode({ id: seed.id, nodeId: sourceReq.id }));
		expect(state.workflows[seed.id]!.nodes.find(n => n.id === sourceReq.id)).toBeUndefined();
		// The clone survives, deep-clone means its data is independent.
		expect(state.workflows[seed.id]!.nodes.find(n => n.id === 'r-clone')).toBeDefined();
	});

	it('config warnings + structural issues compose into a single fix list', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'blank', name: 'mixed', mintId: mint });
		const startId = seed.nodes[0].id;
		// Add a loop with count=0 (config warning) and an unlinked request
		// reachable from Start (no health issue) plus a disconnected
		// notification (unreachable structural issue).
		const seeded: typeof seed = {
			...seed,
			nodes: [
				...seed.nodes,
				{ id: 'l', type: 'loop', position: { x: 0, y: 0 }, data: { mode: 'count', count: 0 } },
				{ id: 'r', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'n', type: 'notification', position: { x: 0, y: 0 }, data: {} },
			],
			edges: [
				{ id: 'e1', source: startId, target: 'l' },
				{ id: 'e2', source: 'l', target: 'r', sourceHandle: 'body' },
			],
		};
		const state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seeded.id, workflow: seeded }));
		const wf = state.workflows[seeded.id]!;

		const health = inspectGraph(wf);
		expect(health.unreachable).toEqual(['n']); // notification not wired
		expect(health.unlinkedRequestNodes).toEqual(['r']); // request not linked

		const warnings = validateWorkflow(wf);
		expect(warnings.has('l')).toBe(true); // loop count=0
		expect(warnings.has('n')).toBe(true); // notification empty
	});

	it('disk-drift cleanup: dangling edges drop before reaching the slice', () => {
		// Mirrors what the file-watch effect does on workflow open. A file
		// arrived from disk with two edges; one of them references a node
		// that no longer exists (merge conflict, manual delete, etc.).
		const drifted = {
			id: 'wf-drift',
			name: 'drift',
			nodes: [
				{ id: 's', type: 'start' as const, position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request' as const, position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [
				{ id: 'e-ok', source: 's', target: 'a' },
				{ id: 'e-dangling', source: 's', target: 'ghost' },
			],
		};
		const cleaned = cleanupDanglingEdges(drifted as never);
		const state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: cleaned.id, workflow: cleaned }));
		const wf = state.workflows[cleaned.id]!;
		// Only the OK edge survives; xyflow won't choke on a missing endpoint.
		expect(wf.edges.map(e => e.id)).toEqual(['e-ok']);
		expect(inspectGraph(wf).danglingEdges).toEqual([]);
	});

	it('searchNodes reflects per-node renames after the slice updates them', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'auth-chain', name: 'auth flow', mintId: mint });
		const requestNodeId = seed.nodes.find(n => n.type === 'request')!.id;
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));
		state = reducer(state, actions.renameNode({ id: seed.id, nodeId: requestNodeId, name: 'Login' }));
		const wf = state.workflows[seed.id]!;
		const results = searchNodes(wf, 'login', new Map());
		expect(results.map(r => r.id)).toContain(requestNodeId);
		// Sanity: the renamed node ranks ahead of the un-renamed second request.
		expect(results[0].id).toBe(requestNodeId);
	});

	it('catches cycle-closing wires at the validator before they reach the slice', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'blank', name: 'cycle test', mintId: mint });
		const start = seed.nodes[0];
		const a = { id: 'a', type: 'request' as const, position: { x: 0, y: 0 }, data: { requestId: null } };
		const b = { id: 'b', type: 'request' as const, position: { x: 0, y: 0 }, data: { requestId: null } };
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: { ...seed, nodes: [...seed.nodes, a, b] } }));
		state = reducer(state, actions.addEdge({ id: seed.id, edge: { id: 'e1', source: start.id, target: 'a' } }));
		state = reducer(state, actions.addEdge({ id: seed.id, edge: { id: 'e2', source: 'a', target: 'b' } }));
		// Validator should reject "b → a" since reaching back from a closes the cycle.
		const result = validateConnection(state.workflows[seed.id]!, { source: 'b', target: 'a' });
		expect(result).toEqual({ ok: false, reason: 'would-create-cycle' });
	});

	it('purges request refs when the underlying project tree drops the request', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'smoke-test', name: 'flow', mintId: mint });
		// Re-key the request node's requestId so we can drop it cleanly.
		seed.nodes = seed.nodes.map(n =>
			n.type === 'request' ? ({ ...n, data: { ...n.data, requestId: 'req-XYZ' } } as typeof n) : n,
		);
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));

		state = reducer(state, actions.purgeRequestRefs({ requestIds: ['req-XYZ'] }));
		const wf = state.workflows[seed.id]!;
		const reqNode = wf.nodes.find(n => n.type === 'request')!;
		expect((reqNode.data as { requestId: string | null }).requestId).toBeNull();

		// Health now flags the node as unlinked.
		const health = inspectGraph(wf);
		expect(health.unlinkedRequestNodes).toContain(reqNode.id);
	});
});
