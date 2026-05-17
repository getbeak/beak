import { describe, expect, it } from 'vitest';

import { workflowSchema } from '../../schemas/beak-workflow';
import {
	autoLayout,
	cloneNodeAt,
	countOverrideEntries,
	edgesAfterNodeRemoval,
	firstIssueNode,
	flightFromNode,
	inspectGraph,
	nodeIssuesFromHealth,
	overrideBadgeText,
	parseImportedWorkflow,
	placeNewNode,
	previewValueSections,
	reachableFromNode,
	reachableFromStart,
	readPlainText,
	searchNodes,
	serializeForExport,
	topologicalOrder,
	validateConnection,
} from '../helpers';
import type { WorkflowFile, WorkflowNode } from '../types';

describe('previewValueSections', () => {
	it('returns empty when parts is undefined', () => {
		expect(previewValueSections(undefined)).toBe('');
	});

	it('joins string parts as-is', () => {
		expect(previewValueSections(['a', 'b', 'c'])).toBe('abc');
	});

	it('collapses non-string parts to {var}', () => {
		expect(previewValueSections(['https://', { type: 'rtv' }, '/users'])).toBe('https://{var}/users');
	});

	it('handles a mix of falsy edge cases', () => {
		expect(previewValueSections([])).toBe('');
		expect(previewValueSections([''])).toBe('');
	});
});

describe('readPlainText', () => {
	it('returns empty when value is not an array', () => {
		expect(readPlainText(undefined)).toBe('');
		expect(readPlainText('hi')).toBe('');
		expect(readPlainText({})).toBe('');
	});

	it('joins only the string entries', () => {
		expect(readPlainText(['hello ', { type: 'rtv' }, 'world'])).toBe('hello world');
	});

	it('returns empty when the array contains no strings', () => {
		expect(readPlainText([{ type: 'rtv' }, 42, null])).toBe('');
	});
});

describe('countOverrideEntries', () => {
	it('returns 0 for undefined', () => {
		expect(countOverrideEntries(undefined)).toBe(0);
	});

	it('returns 0 when every slot is a pass-through', () => {
		expect(countOverrideEntries({ a: {}, b: {} })).toBe(0);
	});

	it('counts slots with value or enabled set', () => {
		expect(countOverrideEntries({ a: { value: ['x'] }, b: {}, c: { enabled: false } })).toBe(2);
	});

	it('treats enabled=true as a touched slot', () => {
		expect(countOverrideEntries({ a: { enabled: true } })).toBe(1);
	});
});

describe('overrideBadgeText', () => {
	it('returns null when there are no overrides', () => {
		expect(overrideBadgeText(undefined)).toBeNull();
		expect(overrideBadgeText({})).toBeNull();
	});

	it('returns null when all slots are pass-throughs', () => {
		expect(overrideBadgeText({ headers: {}, query: {}, body: { fields: {} } })).toBeNull();
	});

	it('joins per-area counts with the middle dot separator', () => {
		const result = overrideBadgeText({
			headers: { h1: { value: ['x'] }, h2: { enabled: false } },
			query: { q1: { value: ['y'] } },
			fragment: ['#frag'],
		});
		expect(result).toBe('2h · 1q · frag');
	});

	it('marks the body when only raw is set', () => {
		expect(overrideBadgeText({ body: { raw: { contentType: 'application/json' } } })).toBe('body');
		expect(overrideBadgeText({ body: { raw: { text: ['payload'] } } })).toBe('body');
		expect(overrideBadgeText({ body: { raw: { text: [] } } })).toBeNull();
	});

	it('marks the body when only fields are set', () => {
		expect(overrideBadgeText({ body: { fields: { id1: { value: 'x' } } } })).toBe('body');
	});
});

describe('placeNewNode', () => {
	it('returns a default position when nothing exists', () => {
		const p = placeNewNode([]);
		expect(p).toEqual({ x: 280, y: 160 });
	});

	it('cascades right from the rightmost existing node', () => {
		const p = placeNewNode([{ position: { x: 100, y: 100 } }]);
		expect(p.x).toBeGreaterThan(100);
		expect(p.y).toBe(100);
	});

	it('snaps to the grid', () => {
		const p = placeNewNode([{ position: { x: 113, y: 207 } }], 20);
		expect(p.x % 20).toBe(0);
		expect(p.y % 20).toBe(0);
	});

	it('steps off when the cascade would collide', () => {
		const existing = [
			{ position: { x: 0, y: 0 } },
			// The cascade target lands here (240 right + 20 grid = 260, snapped):
			{ position: { x: 260, y: 0 } },
		];
		const p = placeNewNode(existing, 20);
		// Must not overlap either node — width is 240, so x must be ≥ 240 from 260.
		const dx1 = Math.abs(p.x - 0);
		const dy1 = Math.abs(p.y - 0);
		expect(dx1 >= 240 || dy1 >= 110).toBe(true);
		const dx2 = Math.abs(p.x - 260);
		const dy2 = Math.abs(p.y - 0);
		expect(dx2 >= 240 || dy2 >= 110).toBe(true);
	});

	it('picks the rightmost-and-then-lowest anchor when multiple share x', () => {
		const p = placeNewNode(
			[{ position: { x: 100, y: 50 } }, { position: { x: 300, y: 50 } }, { position: { x: 300, y: 200 } }],
			20,
		);
		// Anchored off the (300, 200) node — cascade target should be to its right.
		expect(p.x).toBeGreaterThan(300);
		expect(p.y).toBe(200);
	});
});

describe('inspectGraph', () => {
	const makeWorkflow = (overrides: Partial<WorkflowFile> = {}): WorkflowFile => ({
		id: 'wf1',
		name: 'Test workflow',
		nodes: [],
		edges: [],
		...overrides,
	});

	it('reports zero counts on an empty workflow', () => {
		const r = inspectGraph(makeWorkflow());
		expect(r.nodeCount).toBe(0);
		expect(r.edgeCount).toBe(0);
		expect(r.reachable.size).toBe(0);
		expect(r.unreachable).toEqual([]);
		expect(r.danglingEdges).toEqual([]);
		expect(r.unlinkedRequestNodes).toEqual([]);
		expect(r.cycleNodes).toEqual([]);
	});

	it('walks reachability from Start through outbound edges', () => {
		const wf = makeWorkflow({
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
				{ id: 'r2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'r3', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-b' } },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'r1' },
				{ id: 'e2', source: 'r1', target: 'r2' },
				// r3 is dangling — no edge reaches it.
			],
		});
		const r = inspectGraph(wf);
		expect(r.reachable.has('s')).toBe(true);
		expect(r.reachable.has('r1')).toBe(true);
		expect(r.reachable.has('r2')).toBe(true);
		expect(r.reachable.has('r3')).toBe(false);
		expect(r.unreachable).toEqual(['r3']);
	});

	it('drops the Start node from the unreachable list even without a Start', () => {
		const wf = makeWorkflow({
			nodes: [{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode],
		});
		const r = inspectGraph(wf);
		// No Start → everything (except Start nodes) is unreachable.
		expect(r.unreachable).toEqual(['r1']);
	});

	it('collects dangling edges that reference removed nodes', () => {
		const wf = makeWorkflow({
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} } as WorkflowNode],
			edges: [
				{ id: 'e1', source: 's', target: 'ghost' },
				{ id: 'e2', source: 'ghost', target: 's' },
			],
		});
		const r = inspectGraph(wf);
		expect(r.danglingEdges).toEqual(['e1', 'e2']);
	});

	it('does not flag comment nodes as unreachable', () => {
		const wf = makeWorkflow({
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} } as WorkflowNode,
				{ id: 'cm', type: 'comment', position: { x: 0, y: 0 }, data: { text: 'hello' } } as WorkflowNode,
			],
		});
		const r = inspectGraph(wf);
		expect(r.unreachable).toEqual([]);
	});

	it('lists request nodes with no linked request', () => {
		const wf = makeWorkflow({
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} } as WorkflowNode,
				{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
				{ id: 'r2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } } as WorkflowNode,
			],
		});
		const r = inspectGraph(wf);
		expect(r.unlinkedRequestNodes).toEqual(['r1']);
	});

	it('does not loop forever on a cycle', () => {
		const wf = makeWorkflow({
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} } as WorkflowNode,
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'a', target: 'b' },
				{ id: 'e3', source: 'b', target: 'a' },
			],
		});
		const r = inspectGraph(wf);
		expect(Array.from(r.reachable).sort()).toEqual(['a', 'b', 's']);
	});

	it('flags every node sitting on a directed cycle', () => {
		const wf = makeWorkflow({
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} } as WorkflowNode,
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
				{ id: 'c', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'a', target: 'b' },
				{ id: 'e3', source: 'b', target: 'c' },
				{ id: 'e4', source: 'c', target: 'a' },
			],
		});
		expect(inspectGraph(wf).cycleNodes).toEqual(['a', 'b', 'c']);
	});

	it('returns an empty cycle list for a DAG', () => {
		const wf = makeWorkflow({
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} } as WorkflowNode,
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'a', target: 'b' },
			],
		});
		expect(inspectGraph(wf).cycleNodes).toEqual([]);
	});

	it('flags self-loops as cycles', () => {
		const wf = makeWorkflow({
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} } as WorkflowNode,
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'a', target: 'a' },
			],
		});
		expect(inspectGraph(wf).cycleNodes).toEqual(['a']);
	});

	it('does not flag a node whose cycle is in a different connected component', () => {
		const wf = makeWorkflow({
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} } as WorkflowNode,
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
				// b/c are unreachable + cyclic; a is reachable + acyclic.
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
				{ id: 'c', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'b', target: 'c' },
				{ id: 'e3', source: 'c', target: 'b' },
			],
		});
		const r = inspectGraph(wf);
		expect(r.cycleNodes).toEqual(['b', 'c']);
		expect(r.unreachable).toEqual(['b', 'c']);
	});
});

describe('edgesAfterNodeRemoval', () => {
	it('drops every edge that touches the removed node', () => {
		const edges = [
			{ id: 'e1', source: 's', target: 'a' },
			{ id: 'e2', source: 'a', target: 'b' },
			{ id: 'e3', source: 'b', target: 'c' },
		];
		expect(edgesAfterNodeRemoval(edges, 'a')).toEqual([{ id: 'e3', source: 'b', target: 'c' }]);
	});

	it('returns a copy (does not mutate input)', () => {
		const edges = [{ id: 'e1', source: 's', target: 'a' }];
		const next = edgesAfterNodeRemoval(edges, 'gone');
		expect(next).not.toBe(edges);
	});
});

describe('cloneNodeAt', () => {
	it('replaces id and position, keeps everything else', () => {
		const source: WorkflowNode = {
			id: 'a',
			type: 'request',
			position: { x: 10, y: 10 },
			data: { requestId: 'req-x' },
		} as WorkflowNode;
		const cloned = cloneNodeAt(source, 'b', { x: 300, y: 50 });
		expect(cloned.id).toBe('b');
		expect(cloned.position).toEqual({ x: 300, y: 50 });
		expect(cloned.type).toBe('request');
		expect((cloned.data as { requestId: string }).requestId).toBe('req-x');
	});
});

describe('reachableFromStart', () => {
	it('returns [] when there is no Start node', () => {
		expect(
			reachableFromStart({
				id: 'wf',
				name: 'no start',
				nodes: [{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode],
				edges: [],
			}),
		).toEqual([]);
	});

	it('walks BFS in insertion order', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'walk',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'c', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 's', target: 'b' },
				{ id: 'e3', source: 'a', target: 'c' },
			],
		};
		expect(reachableFromStart(wf)).toEqual(['s', 'a', 'b', 'c']);
	});

	it('skips dangling edges', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'dangling',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'ghost' },
				{ id: 'e2', source: 's', target: 'a' },
			],
		};
		expect(reachableFromStart(wf)).toEqual(['s', 'a']);
	});
});

describe('topologicalOrder', () => {
	it('emits Start first, then dependents', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'topo',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'c', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 's', target: 'b' },
				{ id: 'e3', source: 'a', target: 'c' },
				{ id: 'e4', source: 'b', target: 'c' },
			],
		};
		const order = topologicalOrder(wf);
		expect(order[0]).toBe('s');
		expect(order[order.length - 1]).toBe('c');
		expect(order.indexOf('a')).toBeLessThan(order.indexOf('c'));
		expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'));
	});

	it('skips unreachable nodes (they would never run anyway)', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'unreachable',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'orphan', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [{ id: 'e1', source: 's', target: 'a' }],
		};
		expect(topologicalOrder(wf)).toEqual(['s', 'a']);
	});

	it('throws when the graph contains a cycle', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'cycle',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'a', target: 'b' },
				{ id: 'e3', source: 'b', target: 'a' },
			],
		};
		expect(() => topologicalOrder(wf)).toThrow(/cycle/);
	});
});

describe('serializeForExport + parseImportedWorkflow', () => {
	function makeMinter() {
		const counts: Record<string, number> = {};
		return (prefix: 'workflow' | 'node' | 'edge') => {
			counts[prefix] = (counts[prefix] ?? 0) + 1;
			return `${prefix}-${counts[prefix]}`;
		};
	}

	const wf: WorkflowFile = {
		id: 'wf-original',
		name: 'Export me',
		nodes: [
			{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
			{ id: 'a', type: 'request', position: { x: 10, y: 10 }, data: { requestId: 'req-a' } },
		],
		edges: [{ id: 'e1', source: 's', target: 'a' }],
	};

	it('round-trips a workflow through serialize → parse', () => {
		const text = serializeForExport(wf);
		const result = parseImportedWorkflow(text, makeMinter(), raw => workflowSchema.parse(raw));
		expect(result.ok).toBe(true);
		expect(result.workflow).toBeDefined();
		expect(result.workflow!.name).toBe('Export me');
		expect(result.workflow!.nodes).toHaveLength(2);
		expect(result.workflow!.edges).toHaveLength(1);
	});

	it('re-keys every id so paste doesnt collide with the source', () => {
		const text = serializeForExport(wf);
		const result = parseImportedWorkflow(text, makeMinter(), raw => workflowSchema.parse(raw));
		expect(result.workflow!.id).not.toBe('wf-original');
		// All node ids should be fresh + sourced from the minter prefix.
		for (const n of result.workflow!.nodes) {
			expect(n.id.startsWith('node-')).toBe(true);
		}
		// Edges should reference the new node ids, not the old ones.
		for (const e of result.workflow!.edges) {
			expect(result.workflow!.nodes.some(n => n.id === e.source)).toBe(true);
			expect(result.workflow!.nodes.some(n => n.id === e.target)).toBe(true);
		}
	});

	it('returns { ok: false } on malformed JSON', () => {
		const result = parseImportedWorkflow('{not json', makeMinter(), raw => workflowSchema.parse(raw));
		expect(result.ok).toBe(false);
		expect(result.reason).toBeTruthy();
	});

	it('returns { ok: false } on schema-invalid JSON', () => {
		const result = parseImportedWorkflow('{"id":"x"}', makeMinter(), raw => workflowSchema.parse(raw));
		expect(result.ok).toBe(false);
		expect(result.reason).toBeTruthy();
	});
});

describe('nodeIssuesFromHealth + firstIssueNode', () => {
	function makeHealth(parts: Partial<ReturnType<typeof inspectGraph>>): ReturnType<typeof inspectGraph> {
		return {
			nodeCount: 0,
			edgeCount: 0,
			reachable: new Set<string>(),
			unreachable: [],
			danglingEdges: [],
			unlinkedRequestNodes: [],
			cycleNodes: [],
			...parts,
		};
	}

	it('returns an empty map when the graph is clean', () => {
		expect(nodeIssuesFromHealth(makeHealth({}))).toEqual(new Map());
		expect(firstIssueNode(makeHealth({}))).toBeNull();
	});

	it('ranks cycle > unlinked > unreachable per node', () => {
		const issues = nodeIssuesFromHealth(
			makeHealth({
				unreachable: ['x', 'y'],
				unlinkedRequestNodes: ['x'],
				cycleNodes: ['x'],
			}),
		);
		// x lands on all three; ranking promotes it to 'cycle'.
		expect(issues.get('x')).toBe('cycle');
		// y is only unreachable.
		expect(issues.get('y')).toBe('unreachable');
	});

	it('firstIssueNode prefers cycles then unlinked then unreachable', () => {
		expect(firstIssueNode(makeHealth({ cycleNodes: ['a'], unlinkedRequestNodes: ['b'], unreachable: ['c'] }))).toBe('a');
		expect(firstIssueNode(makeHealth({ unlinkedRequestNodes: ['b'], unreachable: ['c'] }))).toBe('b');
		expect(firstIssueNode(makeHealth({ unreachable: ['c'] }))).toBe('c');
	});
});

describe('reachableFromNode + flightFromNode', () => {
	const wf: WorkflowFile = {
		id: 'wf',
		name: 'partial',
		nodes: [
			{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
			{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			{ id: 'c', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			{ id: 'd', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
		],
		edges: [
			{ id: 'e1', source: 's', target: 'a' },
			{ id: 'e2', source: 'a', target: 'b' },
			{ id: 'e3', source: 'b', target: 'c' },
			{ id: 'e4', source: 'a', target: 'd' },
		],
	};

	it('returns empty for an unknown anchor', () => {
		expect(reachableFromNode(wf, 'ghost')).toEqual([]);
		expect(flightFromNode(wf, 'ghost')).toEqual([]);
	});

	it('walks the slice downstream of the anchor', () => {
		const slice = reachableFromNode(wf, 'a').sort();
		expect(slice).toEqual(['a', 'b', 'c', 'd']);
	});

	it('emits the anchor first in the flight order', () => {
		const order = flightFromNode(wf, 'a');
		expect(order[0]).toBe('a');
		expect(order).toHaveLength(4);
	});

	it('respects downstream topological dependencies', () => {
		const order = flightFromNode(wf, 'a');
		expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
		expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'));
	});

	it('returns just the anchor when the slice is a single node', () => {
		const single: WorkflowFile = {
			id: 'wf',
			name: 'single',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'x', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [],
		};
		expect(flightFromNode(single, 'x')).toEqual(['x']);
	});

	it('throws when the slice contains a cycle', () => {
		const cyclic: WorkflowFile = {
			id: 'wf',
			name: 'cyclic slice',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [
				{ id: 'e1', source: 'a', target: 'b' },
				{ id: 'e2', source: 'b', target: 'a' },
			],
		};
		expect(() => flightFromNode(cyclic, 'a')).toThrow(/cycle/);
	});
});

describe('searchNodes', () => {
	const wf: WorkflowFile = {
		id: 'wf',
		name: 'searchable',
		nodes: [
			{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
			{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
			{ id: 'r2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-b' } },
			{ id: 'r3', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			{ id: 'l1', type: 'loop', position: { x: 0, y: 0 }, data: { mode: 'count', count: 5 } } as WorkflowNode,
			{ id: 'c1', type: 'comment', position: { x: 0, y: 0 }, data: { text: 'remember to authenticate first' } } as WorkflowNode,
		],
		edges: [],
	};
	const names = new Map([
		['req-a', 'GET /users'],
		['req-b', 'POST /sessions'],
	]);

	it('returns every node when the query is empty', () => {
		expect(searchNodes(wf, '', names)).toHaveLength(6);
		expect(searchNodes(wf, '   ', names)).toHaveLength(6);
	});

	it('matches linked request names case-insensitively', () => {
		const results = searchNodes(wf, 'users', names);
		expect(results.map(r => r.id)).toContain('r1');
		expect(results.map(r => r.id)).not.toContain('r2');
	});

	it('matches comment text', () => {
		const results = searchNodes(wf, 'authenticate', names);
		expect(results.map(r => r.id)).toContain('c1');
	});

	it('matches by node kind', () => {
		const results = searchNodes(wf, 'loop', names);
		expect(results.map(r => r.id)).toContain('l1');
	});

	it('ranks label-prefix matches above substring matches', () => {
		const wfRanked: WorkflowFile = {
			id: 'wf',
			name: 'rank',
			nodes: [
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-1' } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-2' } },
			],
			edges: [],
		};
		const m = new Map([
			['req-1', 'gather metrics'],
			['req-2', 'metrics dashboard'],
		]);
		const results = searchNodes(wfRanked, 'metrics', m);
		// "metrics dashboard" is a prefix match — should rank above "gather metrics".
		expect(results[0].id).toBe('b');
		expect(results[1].id).toBe('a');
	});

	it('drops the unlinked-request placeholder when the user types', () => {
		const results = searchNodes(wf, 'users', names);
		expect(results.map(r => r.id)).not.toContain('r3');
	});
});

describe('validateConnection', () => {
	const baseWorkflow = (): WorkflowFile => ({
		id: 'wf1',
		name: 'Connections',
		nodes: [
			{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
			{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
		],
		edges: [],
	});

	it('accepts a clean source → target connection', () => {
		expect(validateConnection(baseWorkflow(), { source: 'a', target: 'b' })).toEqual({ ok: true });
	});

	it('rejects connections into Start', () => {
		expect(validateConnection(baseWorkflow(), { source: 'a', target: 's' })).toEqual({
			ok: false,
			reason: 'into-start',
		});
	});

	it('rejects self-loops', () => {
		expect(validateConnection(baseWorkflow(), { source: 'a', target: 'a' })).toEqual({
			ok: false,
			reason: 'self-loop',
		});
	});

	it('rejects when source or target is gone', () => {
		expect(validateConnection(baseWorkflow(), { source: 'ghost', target: 'a' })).toEqual({
			ok: false,
			reason: 'unknown-source',
		});
		expect(validateConnection(baseWorkflow(), { source: 'a', target: 'ghost' })).toEqual({
			ok: false,
			reason: 'unknown-target',
		});
	});

	it('rejects duplicate edges (same source/target + same handles)', () => {
		const wf: WorkflowFile = {
			...baseWorkflow(),
			edges: [{ id: 'e1', source: 'a', target: 'b', sourceHandle: 'body', targetHandle: null }],
		};
		expect(validateConnection(wf, { source: 'a', target: 'b', sourceHandle: 'body', targetHandle: null })).toEqual({
			ok: false,
			reason: 'duplicate-edge',
		});
	});

	it('rejects edges that would close a directed cycle', () => {
		const wf: WorkflowFile = {
			...baseWorkflow(),
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'a', target: 'b' },
			],
		};
		// Adding b → a closes the cycle s → a → b → a.
		expect(validateConnection(wf, { source: 'b', target: 'a' })).toEqual({ ok: false, reason: 'would-create-cycle' });
	});

	it('rejects connections that touch a comment node on either end', () => {
		const wf: WorkflowFile = {
			...baseWorkflow(),
			nodes: [
				...baseWorkflow().nodes,
				{ id: 'cm', type: 'comment', position: { x: 0, y: 0 }, data: { text: 'note' } } as WorkflowNode,
			],
		};
		expect(validateConnection(wf, { source: 'a', target: 'cm' })).toEqual({ ok: false, reason: 'comment-endpoint' });
		expect(validateConnection(wf, { source: 'cm', target: 'a' })).toEqual({ ok: false, reason: 'comment-endpoint' });
	});

	it('accepts the same source/target when the handles differ', () => {
		const wf: WorkflowFile = {
			...baseWorkflow(),
			edges: [{ id: 'e1', source: 'a', target: 'b', sourceHandle: 'body' }],
		};
		expect(validateConnection(wf, { source: 'a', target: 'b', sourceHandle: 'after' })).toEqual({ ok: true });
	});
});

describe('autoLayout', () => {
	const wf = (nodes: WorkflowNode[], edges: WorkflowFile['edges'] = []): WorkflowFile => ({
		id: 'wf1',
		name: 'Auto layout',
		nodes,
		edges,
	});

	it('places Start at the origin and lays children one column right', () => {
		const input = wf(
			[
				{ id: 's', type: 'start', position: { x: 999, y: 999 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 999, y: 999 }, data: { requestId: null } },
			],
			[{ id: 'e1', source: 's', target: 'a' }],
		);
		const out = autoLayout(input, { origin: { x: 80, y: 120 }, rankSpacing: 200, siblingSpacing: 100 });
		expect(out.nodes.find(n => n.id === 's')!.position).toEqual({ x: 80, y: 120 });
		expect(out.nodes.find(n => n.id === 'a')!.position).toEqual({ x: 280, y: 120 });
	});

	it('stacks siblings vertically within a rank', () => {
		const input = wf(
			[
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			[
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 's', target: 'b' },
			],
		);
		const out = autoLayout(input, { origin: { x: 0, y: 0 }, rankSpacing: 200, siblingSpacing: 100 });
		const a = out.nodes.find(n => n.id === 'a')!.position;
		const b = out.nodes.find(n => n.id === 'b')!.position;
		expect(a.x).toBe(200);
		expect(b.x).toBe(200);
		expect(Math.abs(a.y - b.y)).toBe(100);
	});

	it('appends unreachable nodes into trailing ranks so they stay visible', () => {
		const input = wf(
			[
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'orphan', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			[{ id: 'e1', source: 's', target: 'a' }],
		);
		const out = autoLayout(input, { origin: { x: 0, y: 0 }, rankSpacing: 200, siblingSpacing: 100 });
		const orphanX = out.nodes.find(n => n.id === 'orphan')!.position.x;
		const aX = out.nodes.find(n => n.id === 'a')!.position.x;
		// Orphan must be strictly further right than the reachable column.
		expect(orphanX).toBeGreaterThan(aX);
	});

	it('does not crash and lays out everything when there is no Start node', () => {
		const input = wf([
			{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
			{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
		]);
		const out = autoLayout(input);
		// Both still get a position assignment — they fall into the tail ranks.
		const a = out.nodes.find(n => n.id === 'a')!.position;
		const b = out.nodes.find(n => n.id === 'b')!.position;
		expect(a).not.toEqual({ x: 0, y: 0 });
		expect(b).not.toEqual({ x: 0, y: 0 });
	});

	it('is idempotent — running twice returns the same layout', () => {
		const input = wf(
			[
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			[
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'a', target: 'b' },
			],
		);
		const once = autoLayout(input);
		const twice = autoLayout(once);
		expect(twice.nodes).toEqual(once.nodes);
	});
});
