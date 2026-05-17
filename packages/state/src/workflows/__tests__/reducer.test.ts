import { createReducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import * as actions from '../actions';
import { buildWorkflowsReducer } from '../reducer';
import { initialWorkflowsState, type WorkflowFile, type WorkflowsState } from '../types';

/**
 * Tiny test harness — composes only the pure cases so we exercise the
 * reducer without dragging the UI-package write-debounce fields in.
 */
const reducer = createReducer<WorkflowsState>(initialWorkflowsState, builder => {
	buildWorkflowsReducer(builder);
});

const makeWorkflow = (overrides: Partial<WorkflowFile> = {}): WorkflowFile => ({
	id: 'wf1',
	name: 'Test workflow',
	nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
	edges: [],
	...overrides,
});

describe('workflows reducer — node removal cascade', () => {
	it('removes the node and every edge that touches it', () => {
		const start: WorkflowsState = {
			loaded: true,
			workflows: {
				wf1: makeWorkflow({
					nodes: [
						{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
						{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
						{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
					],
					edges: [
						{ id: 'e1', source: 's', target: 'a' },
						{ id: 'e2', source: 'a', target: 'b' },
						{ id: 'e3', source: 'b', target: 's' },
					],
				}),
			},
		};
		const next = reducer(start, actions.removeNode({ id: 'wf1', nodeId: 'a' }));
		const wf = next.workflows.wf1!;
		expect(wf.nodes.map(n => n.id)).toEqual(['s', 'b']);
		// e1 (target=a) and e2 (source=a) drop; e3 stays.
		expect(wf.edges.map(e => e.id)).toEqual(['e3']);
	});

	it('is a no-op when the target workflow is gone', () => {
		const next = reducer(initialWorkflowsState, actions.removeNode({ id: 'missing', nodeId: 'a' }));
		expect(next).toEqual(initialWorkflowsState);
	});
});

describe('workflows reducer — addEdge dedupe', () => {
	it('dedupes by edge id so accidental double-connects are no-ops', () => {
		const start: WorkflowsState = {
			loaded: true,
			workflows: {
				wf1: makeWorkflow({
					nodes: [
						{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
						{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
					],
				}),
			},
		};
		const e = { id: 'edge-1', source: 's', target: 'a' };
		const afterFirst = reducer(start, actions.addEdge({ id: 'wf1', edge: e }));
		const afterSecond = reducer(afterFirst, actions.addEdge({ id: 'wf1', edge: e }));
		expect(afterSecond.workflows.wf1!.edges).toEqual([e]);
	});
});

describe('workflows reducer — purgeRequestRefs', () => {
	it('clears `requestId` only on request nodes that point at a dropped id', () => {
		const start: WorkflowsState = {
			loaded: true,
			workflows: {
				wf1: makeWorkflow({
					nodes: [
						{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
						{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
						{ id: 'r2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-b' } },
					],
				}),
				wf2: makeWorkflow({
					id: 'wf2',
					nodes: [
						{ id: 's2', type: 'start', position: { x: 0, y: 0 }, data: {} },
						{ id: 'r3', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
					],
				}),
			},
		};
		const next = reducer(start, actions.purgeRequestRefs({ requestIds: ['req-a'] }));
		const wf1Nodes = next.workflows.wf1!.nodes;
		const wf2Nodes = next.workflows.wf2!.nodes;
		expect((wf1Nodes.find(n => n.id === 'r1')!.data as { requestId: string | null }).requestId).toBeNull();
		expect((wf1Nodes.find(n => n.id === 'r2')!.data as { requestId: string | null }).requestId).toBe('req-b');
		expect((wf2Nodes.find(n => n.id === 'r3')!.data as { requestId: string | null }).requestId).toBeNull();
	});

	it('is a no-op when the requestIds set is empty', () => {
		const start: WorkflowsState = {
			loaded: true,
			workflows: {
				wf1: makeWorkflow({
					nodes: [
						{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
						{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
					],
				}),
			},
		};
		const next = reducer(start, actions.purgeRequestRefs({ requestIds: [] }));
		expect(next).toBe(start);
	});

	it('ignores non-request nodes', () => {
		const start: WorkflowsState = {
			loaded: true,
			workflows: {
				wf1: makeWorkflow({
					nodes: [
						{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
						{
							id: 'l1',
							type: 'loop',
							position: { x: 0, y: 0 },
							data: { mode: 'count', count: 1 },
						},
					],
				}),
			},
		};
		const next = reducer(start, actions.purgeRequestRefs({ requestIds: ['req-a'] }));
		// Loop nodes don't carry requestId — the sweep should skip them entirely.
		expect(next.workflows.wf1).toEqual(start.workflows.wf1);
	});
});

describe('workflows reducer — updateNodeData', () => {
	it('merges into the node data without clobbering unrelated keys', () => {
		const start: WorkflowsState = {
			loaded: true,
			workflows: {
				wf1: makeWorkflow({
					nodes: [
						{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
						{
							id: 'l1',
							type: 'loop',
							position: { x: 0, y: 0 },
							data: { mode: 'count', count: 3 },
						},
					],
				}),
			},
		};
		const next = reducer(start, actions.updateNodeData({ id: 'wf1', nodeId: 'l1', data: { count: 9 } }));
		const node = next.workflows.wf1!.nodes.find(n => n.id === 'l1')!;
		const d = node.data as { mode: string; count: number };
		expect(d.mode).toBe('count');
		expect(d.count).toBe(9);
	});
});

describe('workflows reducer — replaceGraph', () => {
	it('swaps both arrays atomically and is a no-op when the workflow is gone', () => {
		const start: WorkflowsState = {
			loaded: true,
			workflows: {
				wf1: makeWorkflow(),
			},
		};
		const nodes: WorkflowFile['nodes'] = [
			{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
			{ id: 'n', type: 'notification', position: { x: 10, y: 10 }, data: {} },
		];
		const edges: WorkflowFile['edges'] = [{ id: 'e', source: 's', target: 'n' }];
		const next = reducer(start, actions.replaceGraph({ id: 'wf1', nodes, edges }));
		expect(next.workflows.wf1!.nodes).toEqual(nodes);
		expect(next.workflows.wf1!.edges).toEqual(edges);

		const noop = reducer(start, actions.replaceGraph({ id: 'missing', nodes, edges }));
		expect(noop).toEqual(start);
	});
});

describe('workflows reducer — removeNodes (bulk)', () => {
	const makeState = (): WorkflowsState => ({
		loaded: true,
		workflows: {
			wf1: makeWorkflow({
				nodes: [
					{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
					{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
					{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
					{ id: 'c', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				],
				edges: [
					{ id: 'e1', source: 's', target: 'a' },
					{ id: 'e2', source: 'a', target: 'b' },
					{ id: 'e3', source: 'b', target: 'c' },
					{ id: 'e4', source: 's', target: 'c' },
				],
			}),
		},
	});

	it('removes every named node and every edge touching one', () => {
		const start = makeState();
		const next = reducer(start, actions.removeNodes({ id: 'wf1', nodeIds: ['a', 'b'] }));
		const wf = next.workflows.wf1!;
		expect(wf.nodes.map(n => n.id).sort()).toEqual(['c', 's']);
		// e1, e2, e3 touched a or b; only e4 (s → c) survives.
		expect(wf.edges.map(e => e.id)).toEqual(['e4']);
	});

	it('silently skips Start nodes so callers can pass raw selection sets', () => {
		const start = makeState();
		const next = reducer(start, actions.removeNodes({ id: 'wf1', nodeIds: ['s', 'a'] }));
		const wf = next.workflows.wf1!;
		expect(wf.nodes.find(n => n.id === 's')).toBeDefined();
		expect(wf.nodes.find(n => n.id === 'a')).toBeUndefined();
	});

	it('is a no-op for empty input', () => {
		const start = makeState();
		const next = reducer(start, actions.removeNodes({ id: 'wf1', nodeIds: [] }));
		expect(next).toBe(start);
	});

	it('is a no-op when the workflow is gone', () => {
		const start = makeState();
		const next = reducer(start, actions.removeNodes({ id: 'missing', nodeIds: ['a'] }));
		expect(next).toEqual(start);
	});

	it('ignores ids that no longer exist on the workflow', () => {
		const start = makeState();
		const next = reducer(start, actions.removeNodes({ id: 'wf1', nodeIds: ['ghost', 'a'] }));
		const wf = next.workflows.wf1!;
		expect(wf.nodes.find(n => n.id === 'a')).toBeUndefined();
		expect(wf.nodes).toHaveLength(3);
	});
});

describe('workflows reducer — duplicateNode', () => {
	const makeState = (): WorkflowsState => ({
		loaded: true,
		workflows: {
			wf1: makeWorkflow({
				nodes: [
					{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
					{
						id: 'r1',
						type: 'request',
						position: { x: 100, y: 50 },
						data: {
							requestId: 'req-a',
							overrides: { headers: { h1: { value: ['x'] } } },
						},
					},
				],
			}),
		},
	});

	it('clones a node under a fresh id at the supplied position', () => {
		const start = makeState();
		const next = reducer(
			start,
			actions.duplicateNode({ id: 'wf1', sourceNodeId: 'r1', newNodeId: 'r1-clone', position: { x: 300, y: 50 } }),
		);
		const cloned = next.workflows.wf1!.nodes.find(n => n.id === 'r1-clone');
		expect(cloned).toBeDefined();
		expect(cloned!.position).toEqual({ x: 300, y: 50 });
		expect(cloned!.type).toBe('request');
	});

	it("deep-clones the `data` field so edits don't alias the source", () => {
		const start = makeState();
		const next = reducer(
			start,
			actions.duplicateNode({ id: 'wf1', sourceNodeId: 'r1', newNodeId: 'r1-clone', position: { x: 300, y: 50 } }),
		);
		const source = next.workflows.wf1!.nodes.find(n => n.id === 'r1')!;
		const cloned = next.workflows.wf1!.nodes.find(n => n.id === 'r1-clone')!;
		expect(cloned.data).not.toBe(source.data);
		expect((cloned.data as { overrides: object }).overrides).not.toBe((source.data as { overrides: object }).overrides);
	});

	it('refuses to clone Start nodes', () => {
		const start = makeState();
		const next = reducer(
			start,
			actions.duplicateNode({ id: 'wf1', sourceNodeId: 's', newNodeId: 's-clone', position: { x: 99, y: 99 } }),
		);
		expect(next.workflows.wf1!.nodes.map(n => n.id)).toEqual(['s', 'r1']);
	});

	it('is a no-op when source or workflow is missing', () => {
		const start = makeState();
		const a = reducer(
			start,
			actions.duplicateNode({ id: 'missing', sourceNodeId: 'r1', newNodeId: 'x', position: { x: 0, y: 0 } }),
		);
		const b = reducer(
			start,
			actions.duplicateNode({ id: 'wf1', sourceNodeId: 'ghost', newNodeId: 'x', position: { x: 0, y: 0 } }),
		);
		expect(a).toEqual(start);
		expect(b).toEqual(start);
	});
});

describe('workflows reducer — moveNode', () => {
	it('moves the node and ignores moves targeting missing nodes', () => {
		const start: WorkflowsState = {
			loaded: true,
			workflows: {
				wf1: makeWorkflow({
					nodes: [
						{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
						{ id: 'a', type: 'request', position: { x: 10, y: 10 }, data: { requestId: null } },
					],
				}),
			},
		};
		const next = reducer(start, actions.moveNode({ id: 'wf1', nodeId: 'a', position: { x: 200, y: 80 } }));
		expect(next.workflows.wf1!.nodes.find(n => n.id === 'a')!.position).toEqual({ x: 200, y: 80 });

		const noop = reducer(start, actions.moveNode({ id: 'wf1', nodeId: 'ghost', position: { x: 1, y: 1 } }));
		expect(noop.workflows.wf1).toEqual(start.workflows.wf1);
	});
});
