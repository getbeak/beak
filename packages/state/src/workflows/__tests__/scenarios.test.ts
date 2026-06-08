import { createReducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import * as actions from '../actions';
import { diffWorkflows, summariseChange } from '../diff';
import {
	cleanupDanglingEdges,
	completionRatio,
	duplicateWorkflow,
	extractAllTags,
	findDuplicateNames,
	findTargetsOf,
	inspectGraph,
	linkedRequestIds,
	mergeWorkflows,
	searchNodes,
	uniqueWorkflowName,
	validateConnection,
} from '../helpers';
import { buildWorkflowsReducer } from '../reducer';
import { workflowStats } from '../stats';
import { instantiateTemplate } from '../templates';
import { validateWorkflow } from '../validation';
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

	it('diffWorkflows + summariseChange describe a merge as +N steps, +N edges', () => {
		const mintA = counterMinter();
		const a = instantiateTemplate({ template: 'blank', name: 'A', mintId: mintA });
		const mintB = counterMinter();
		const b = instantiateTemplate({ template: 'smoke-test', name: 'B', mintId: mintB });

		let mergeCounter = 0;
		const mergeMint = (prefix: 'node' | 'edge') => `${prefix}-merge-${mergeCounter++}`;
		const merged = mergeWorkflows(a, b, mergeMint);

		const diff = diffWorkflows(a, merged);
		// smoke-test seeds: start + request + notification (3); start dropped → 2 grafted nodes.
		expect(diff.addedNodes).toHaveLength(2);
		// smoke-test seeds 2 edges (s→r, r→n); the s→r edge is filtered out
		// because the source Start was dropped. Only r→n grafts.
		expect(diff.addedEdges).toHaveLength(1);
		const summary = summariseChange(diff);
		expect(summary).toContain('+2 step');
		expect(summary).toContain('+1 edge');
	});

	it('mergeWorkflows + replaceGraph composes two workflows into one', () => {
		const mintA = counterMinter();
		const a = instantiateTemplate({ template: 'smoke-test', name: 'A', mintId: mintA });
		const mintB = counterMinter();
		const b = instantiateTemplate({ template: 'auth-chain', name: 'B', mintId: mintB });
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: a.id, workflow: a }));

		const mergeMint = (prefix: 'node' | 'edge') => `${prefix}-merge-${Math.random().toString(36).slice(2, 8)}`;
		const merged = mergeWorkflows(a, b, mergeMint);
		state = reducer(state, actions.replaceGraph({ id: a.id, nodes: merged.nodes, edges: merged.edges }));

		const result = state.workflows[a.id]!;
		// Source's Start dropped; everything else grafted on. A had 3 nodes
		// (start, request, notification); B had 3 (start, request, request),
		// minus B's Start = 2. Total: 5.
		expect(result.nodes).toHaveLength(5);
		// Exactly one Start (from A).
		expect(result.nodes.filter(n => n.type === 'start')).toHaveLength(1);
	});

	it('extractAllTags returns the union across the slice', () => {
		const a = instantiateTemplate({ template: 'blank', name: 'A', mintId: counterMinter() });
		const b = { ...a, id: 'wf-b', name: 'B' };
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: a.id, workflow: a }));
		state = reducer(state, actions.insertNewWorkflow({ id: b.id, workflow: b }));
		state = reducer(state, actions.setWorkflowTags({ id: a.id, tags: ['auth', 'smoke'] }));
		state = reducer(state, actions.setWorkflowTags({ id: b.id, tags: ['smoke', 'staging'] }));

		const tags = extractAllTags(state.workflows);
		expect(tags).toEqual(['auth', 'smoke', 'staging']);
	});

	it('findTargetsOf reflects edges added through the slice', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'blank', name: 'walk', mintId: mint });
		const startId = seed.nodes[0].id;
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));
		state = reducer(
			state,
			actions.addNode({
				id: seed.id,
				node: { id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			}),
		);
		state = reducer(state, actions.addEdge({ id: seed.id, edge: { id: 'e1', source: startId, target: 'a' } }));
		expect(findTargetsOf(state.workflows[seed.id]!, startId)).toEqual(['a']);
	});

	it('tags + description round-trip through the slice', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'blank', name: 'meta', mintId: mint });
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));

		state = reducer(state, actions.updateWorkflowDescription({ id: seed.id, description: 'Smoke test against staging' }));
		state = reducer(state, actions.setWorkflowTags({ id: seed.id, tags: ['  AUTH ', 'Auth', 'staging'] }));

		const wf = state.workflows[seed.id]!;
		expect(wf.description).toBe('Smoke test against staging');
		// Normalised: trimmed + lowercased + deduped.
		expect(wf.tags).toEqual(['auth', 'staging']);
	});

	it('workflowStats follows the slice through add/remove cycles', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'blank', name: 'live', mintId: mint });
		const startId = seed.nodes[0].id;
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));
		expect(workflowStats(state.workflows[seed.id]!).nodesByKind.request).toBe(0);

		state = reducer(
			state,
			actions.addNode({
				id: seed.id,
				node: { id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
			}),
		);
		state = reducer(state, actions.addEdge({ id: seed.id, edge: { id: 'e1', source: startId, target: 'r1' } }));
		const afterAdd = workflowStats(state.workflows[seed.id]!);
		expect(afterAdd.nodesByKind.request).toBe(1);
		expect(afterAdd.linkedRequestCount).toBe(1);
		expect(afterAdd.edgeCount).toBe(1);

		state = reducer(state, actions.removeNode({ id: seed.id, nodeId: 'r1' }));
		const afterRemove = workflowStats(state.workflows[seed.id]!);
		expect(afterRemove.nodesByKind.request).toBe(0);
		expect(afterRemove.edgeCount).toBe(0); // cascade-deleted with the node
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
		let state = reducer(
			initialWorkflowsState,
			actions.insertNewWorkflow({ id: seed.id, workflow: { ...seed, nodes: [...seed.nodes, a, b] } }),
		);
		state = reducer(state, actions.addEdge({ id: seed.id, edge: { id: 'e1', source: start.id, target: 'a' } }));
		state = reducer(state, actions.addEdge({ id: seed.id, edge: { id: 'e2', source: 'a', target: 'b' } }));
		// Validator should reject "b → a" since reaching back from a closes the cycle.
		const result = validateConnection(state.workflows[seed.id]!, { source: 'b', target: 'a' });
		expect(result).toEqual({ ok: false, reason: 'would-create-cycle' });
	});

	it('duplicates a workflow into the same store under a fresh id', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'smoke-test', name: 'Original', mintId: mint });
		const seeded: typeof seed = { ...seed, tags: ['smoke', 'auth'], description: 'Hits the API once' };
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seeded.id, workflow: seeded }));

		const clone = duplicateWorkflow(state.workflows[seeded.id]!, mint);
		state = reducer(state, actions.insertNewWorkflow({ id: clone.id, workflow: clone }));

		// Both workflows live under distinct ids.
		expect(Object.keys(state.workflows).sort()).toEqual([seeded.id, clone.id].sort());
		// Source untouched: same nodes / edges / name.
		const source = state.workflows[seeded.id]!;
		expect(source.name).toBe('Original');
		expect(source.nodes.map(n => n.id)).toEqual(seeded.nodes.map(n => n.id));
		// Clone carries the "Copy of …" default and inherits tags + description.
		const fresh = state.workflows[clone.id]!;
		expect(fresh.name).toBe('Copy of Original');
		expect(fresh.tags).toEqual(['smoke', 'auth']);
		expect(fresh.description).toBe('Hits the API once');
		// Reducer stamps createdAt on insert because the helper cleared it.
		expect(typeof fresh.createdAt).toBe('number');
		// Every cloned edge points at the cloned node ids, not the source ones.
		const cloneNodeIds = new Set(fresh.nodes.map(n => n.id));
		for (const e of fresh.edges) {
			expect(cloneNodeIds.has(e.source)).toBe(true);
			expect(cloneNodeIds.has(e.target)).toBe(true);
		}
		// And the clone's ids are disjoint from the source's.
		const sourceNodeIds = new Set(source.nodes.map(n => n.id));
		for (const id of cloneNodeIds) expect(sourceNodeIds.has(id)).toBe(false);
	});

	it('duplicates the same source twice — each clone lands on a unique name', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'blank', name: 'Original', mintId: mint });
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));

		// First clone — collides with nothing.
		const first = duplicateWorkflow(state.workflows[seed.id]!, mint, {
			existingNames: Object.values(state.workflows).map(w => w.name),
		});
		state = reducer(state, actions.insertNewWorkflow({ id: first.id, workflow: first }));
		expect(first.name).toBe('Copy of Original');

		// Second clone of the same source — must walk past the first clone.
		const second = duplicateWorkflow(state.workflows[seed.id]!, mint, {
			existingNames: Object.values(state.workflows).map(w => w.name),
		});
		state = reducer(state, actions.insertNewWorkflow({ id: second.id, workflow: second }));
		expect(second.name).toBe('Copy of Original (2)');

		// Three workflows under three distinct ids.
		expect(Object.keys(state.workflows).length).toBe(3);
		const names = Object.values(state.workflows)
			.map(w => w.name)
			.sort();
		expect(names).toEqual(['Copy of Original', 'Copy of Original (2)', 'Original']);
	});

	it('uniqueWorkflowName works against the live store + findDuplicateNames flags real collisions', () => {
		const mint = counterMinter();
		const a = instantiateTemplate({ template: 'blank', name: 'Auth', mintId: mint });
		const b = instantiateTemplate({ template: 'blank', name: 'Auth', mintId: mint });
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: a.id, workflow: a }));
		state = reducer(state, actions.insertNewWorkflow({ id: b.id, workflow: b }));

		const dups = findDuplicateNames(state.workflows);
		expect(dups).toEqual([{ name: 'Auth', ids: [a.id, b.id] }]);

		// Now produce a non-colliding name for a new sibling using the same
		// uniqueWorkflowName helper the renaming flow uses.
		const next = uniqueWorkflowName(
			'Auth',
			Object.values(state.workflows).map(w => w.name),
		);
		expect(next).toBe('Auth (2)');

		// Insert under the new name and re-check — the duplicates list now
		// surfaces nothing (since "Auth (2)" is distinct).
		state = reducer(state, actions.updateWorkflowName({ id: b.id, name: next }));
		expect(findDuplicateNames(state.workflows)).toEqual([]);
	});

	it('completionRatio tracks request-step linking through the slice lifecycle', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'blank', name: 'flow', mintId: mint });
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));
		// Empty workflow (Start only): vacuously complete.
		expect(completionRatio(state.workflows[seed.id]!)).toBe(1);

		// Add an unlinked request → 0%.
		state = reducer(
			state,
			actions.addNode({
				id: seed.id,
				node: { id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			}),
		);
		expect(completionRatio(state.workflows[seed.id]!)).toBe(0);

		// Link it → 100%.
		state = reducer(state, actions.updateNodeData({ id: seed.id, nodeId: 'r1', data: { requestId: 'req-X' } }));
		expect(completionRatio(state.workflows[seed.id]!)).toBe(1);

		// Add a second unlinked request → 50%.
		state = reducer(
			state,
			actions.addNode({
				id: seed.id,
				node: { id: 'r2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			}),
		);
		expect(completionRatio(state.workflows[seed.id]!)).toBe(0.5);
	});

	it('linkedRequestIds round-trips through the slice as requests are linked / unlinked', () => {
		const mint = counterMinter();
		const seed = instantiateTemplate({ template: 'blank', name: 'flow', mintId: mint });
		let state = reducer(initialWorkflowsState, actions.insertNewWorkflow({ id: seed.id, workflow: seed }));

		// Two request nodes, one linked.
		state = reducer(
			state,
			actions.addNode({
				id: seed.id,
				node: { id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-A' } },
			}),
		);
		state = reducer(
			state,
			actions.addNode({
				id: seed.id,
				node: { id: 'r2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			}),
		);
		expect(linkedRequestIds(state.workflows[seed.id]!)).toEqual(['req-A']);

		// Link the second, distinct id.
		state = reducer(state, actions.updateNodeData({ id: seed.id, nodeId: 'r2', data: { requestId: 'req-B' } }));
		expect(linkedRequestIds(state.workflows[seed.id]!)).toEqual(['req-A', 'req-B']);

		// Re-link r2 to the same id as r1 — distinct ids drop back to one.
		state = reducer(state, actions.updateNodeData({ id: seed.id, nodeId: 'r2', data: { requestId: 'req-A' } }));
		expect(linkedRequestIds(state.workflows[seed.id]!)).toEqual(['req-A']);

		// Purging req-A propagates: both nodes go back to null, list is empty.
		state = reducer(state, actions.purgeRequestRefs({ requestIds: ['req-A'] }));
		expect(linkedRequestIds(state.workflows[seed.id]!)).toEqual([]);
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
