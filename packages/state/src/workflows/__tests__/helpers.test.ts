import { describe, expect, it } from 'vitest';

import { workflowSchema } from '../../schemas/beak-workflow';
import {
	autoLayout,
	cleanupDanglingEdges,
	cloneNodeAt,
	compactPositions,
	completionRatio,
	connectedComponents,
	countOverrideEntries,
	duplicateWorkflow,
	edgesAfterNodeRemoval,
	extractAllTags,
	findDuplicateNames,
	findIsolatedNodes,
	findRequestStepsUsing,
	findSourcesOf,
	findTargetsOf,
	findWorkflowByName,
	firstIssueNode,
	firstUnlinkedRequest,
	flightFromNode,
	formatRelativeTime,
	groupWorkflowsByParent,
	inspectGraph,
	linkedRequestIds,
	mergeWorkflows,
	nodeBounds,
	nodeIssuesFromHealth,
	overrideBadgeText,
	parentIdsUsed,
	parseImportedWorkflow,
	placeNewNode,
	previewValueSections,
	reachableFromNode,
	reachableFromStart,
	recentWorkflows,
	readPlainText,
	searchNodes,
	searchWorkflows,
	serializeForExport,
	summariseHealth,
	tagCount,
	topologicalOrder,
	uniqueWorkflowName,
	unusedTags,
	validateConnection,
	workflowDepth,
	workflowsByTag,
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

describe('connectedComponents', () => {
	it('returns one component per weakly-connected group', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'components',
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
				// c <-> d is its own island
				{ id: 'e3', source: 'c', target: 'd' },
			],
		};
		const components = connectedComponents(wf);
		expect(components).toHaveLength(2);
		expect(components[0].sort()).toEqual(['a', 'b', 's']);
		expect(components[1].sort()).toEqual(['c', 'd']);
	});

	it('skips comment nodes (they are never wired into the flow)', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'with-comment',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'cm', type: 'comment', position: { x: 0, y: 0 }, data: { text: 'hi' } } as never,
			],
			edges: [],
		};
		const components = connectedComponents(wf);
		expect(components).toEqual([['s']]);
	});
});

describe('nodeBounds', () => {
	it('returns null for an empty array', () => {
		expect(nodeBounds([])).toBeNull();
	});

	it('computes min/max/width/height across positions', () => {
		const result = nodeBounds([
			{ position: { x: 100, y: 50 } },
			{ position: { x: 300, y: 200 } },
			{ position: { x: -20, y: 80 } },
		]);
		expect(result).toEqual({ minX: -20, minY: 50, maxX: 300, maxY: 200, width: 320, height: 150 });
	});

	it('collapses to zero w/h for a single node', () => {
		const result = nodeBounds([{ position: { x: 10, y: 10 } }]);
		expect(result).toEqual({ minX: 10, minY: 10, maxX: 10, maxY: 10, width: 0, height: 0 });
	});
});

describe('mergeWorkflows', () => {
	function makeMinter() {
		const counts: Record<string, number> = {};
		return (prefix: 'node' | 'edge') => {
			counts[prefix] = (counts[prefix] ?? 0) + 1;
			return `${prefix}-merged-${counts[prefix]}`;
		};
	}

	const into: WorkflowFile = {
		id: 'wf-into',
		name: 'into',
		nodes: [
			{ id: 's', type: 'start', position: { x: 80, y: 120 }, data: {} },
			{ id: 'a', type: 'request', position: { x: 280, y: 120 }, data: { requestId: null } },
		],
		edges: [{ id: 'e1', source: 's', target: 'a' }],
	};

	const source: WorkflowFile = {
		id: 'wf-src',
		name: 'src',
		nodes: [
			{ id: 's2', type: 'start', position: { x: 0, y: 0 }, data: {} },
			{ id: 'b', type: 'notification', position: { x: 200, y: 0 }, data: {} },
			{ id: 'c', type: 'comment', position: { x: 200, y: 100 }, data: { text: 'hi' } },
		],
		edges: [
			{ id: 'es1', source: 's2', target: 'b' },
			{ id: 'es2', source: 'b', target: 'c' },
		],
	};

	it("drops source's Start node and grafts the rest", () => {
		const merged = mergeWorkflows(into, source, makeMinter());
		const types = merged.nodes.map(n => n.type);
		expect(types.filter(t => t === 'start').length).toBe(1); // only the existing Start
		expect(merged.nodes.length).toBe(into.nodes.length + (source.nodes.length - 1));
	});

	it('re-keys node + edge ids; edges referencing the dropped Start are filtered', () => {
		const merged = mergeWorkflows(into, source, makeMinter());
		// es1 referenced source's Start, which is dropped — so es1 doesn't survive.
		// es2 was b → c; both got re-keyed.
		expect(merged.edges.length).toBe(into.edges.length + 1);
		// New edge ids are all under the merge minter's prefix.
		const newEdgeIds = merged.edges.filter(e => !into.edges.some(prev => prev.id === e.id));
		for (const e of newEdgeIds) expect(e.id.startsWith('edge-merged-')).toBe(true);
	});

	it('shifts source nodes to land right of `into`s rightmost', () => {
		const merged = mergeWorkflows(into, source, makeMinter());
		const intoMax = Math.max(...into.nodes.map(n => n.position.x));
		const sourceXs = merged.nodes
			.filter(n => !into.nodes.some(prev => prev.id === n.id))
			.map(n => n.position.x);
		for (const x of sourceXs) expect(x).toBeGreaterThan(intoMax);
	});
});

describe('compactPositions', () => {
	const baseWorkflow = (nodes: { x: number; y: number }[]): WorkflowFile => ({
		id: 'wf',
		name: 'compact',
		nodes: nodes.map((p, i) => ({
			id: `n${i}`,
			type: 'request',
			position: p,
			data: { requestId: null },
		})) as WorkflowFile['nodes'],
		edges: [],
	});

	it('returns the same ref for an empty workflow', () => {
		const wf: WorkflowFile = { id: 'wf', name: 'empty', nodes: [], edges: [] };
		expect(compactPositions(wf)).toBe(wf);
	});

	it('shifts so the leftmost lands at the margin', () => {
		const wf = baseWorkflow([
			{ x: -50, y: 100 },
			{ x: 200, y: 350 },
		]);
		const compacted = compactPositions(wf, { x: 40, y: 40 });
		expect(compacted.nodes[0].position).toEqual({ x: 40, y: 40 });
		expect(compacted.nodes[1].position).toEqual({ x: 290, y: 290 });
	});

	it('is idempotent — running twice changes nothing the second time', () => {
		const wf = baseWorkflow([
			{ x: -10, y: -20 },
			{ x: 30, y: 50 },
		]);
		const once = compactPositions(wf);
		const twice = compactPositions(once);
		expect(twice).toBe(once);
	});

	it('returns the same ref when nodes are already at the margin', () => {
		const wf = baseWorkflow([
			{ x: 40, y: 40 },
			{ x: 200, y: 100 },
		]);
		expect(compactPositions(wf)).toBe(wf);
	});
});

describe('cleanupDanglingEdges', () => {
	it('returns the same workflow ref when no edges are dangling', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'clean',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [{ id: 'e1', source: 's', target: 'a' }],
		};
		expect(cleanupDanglingEdges(wf)).toBe(wf);
	});

	it('drops only edges whose source or target is missing', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'dangling',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'ghost', target: 'a' },
				{ id: 'e3', source: 's', target: 'phantom' },
			],
		};
		const cleaned = cleanupDanglingEdges(wf);
		expect(cleaned.edges.map(e => e.id)).toEqual(['e1']);
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

describe('duplicateWorkflow', () => {
	function makeMinter() {
		const counts: Record<string, number> = {};
		return (prefix: 'workflow' | 'node' | 'edge') => {
			counts[prefix] = (counts[prefix] ?? 0) + 1;
			return `${prefix}-dup-${counts[prefix]}`;
		};
	}

	const source: WorkflowFile = {
		id: 'wf-src',
		name: 'Original',
		createdAt: 100,
		updatedAt: 200,
		tags: ['auth'],
		nodes: [
			{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
			{ id: 'a', type: 'request', position: { x: 10, y: 10 }, data: { requestId: 'req-1' } },
		],
		edges: [{ id: 'e1', source: 's', target: 'a' }],
	};

	it('re-keys every id', () => {
		const cloned = duplicateWorkflow(source, makeMinter());
		expect(cloned.id).not.toBe(source.id);
		for (const n of cloned.nodes) {
			expect(n.id.startsWith('node-dup-')).toBe(true);
		}
		for (const e of cloned.edges) {
			expect(e.id.startsWith('edge-dup-')).toBe(true);
		}
	});

	it('defaults name to "Copy of …"', () => {
		const cloned = duplicateWorkflow(source, makeMinter());
		expect(cloned.name).toBe('Copy of Original');
	});

	it('honours an explicit name override', () => {
		const cloned = duplicateWorkflow(source, makeMinter(), { name: 'My fork' });
		expect(cloned.name).toBe('My fork');
	});

	it('clears createdAt / updatedAt so the clone reads as fresh', () => {
		const cloned = duplicateWorkflow(source, makeMinter());
		expect(cloned.createdAt).toBeUndefined();
		expect(cloned.updatedAt).toBeUndefined();
	});

	it('preserves tags, description, version', () => {
		const cloned = duplicateWorkflow(
			{ ...source, description: 'hi', version: '1' },
			makeMinter(),
		);
		expect(cloned.tags).toEqual(['auth']);
		expect(cloned.description).toBe('hi');
		expect(cloned.version).toBe('1');
	});

	it('edges reference the cloned node ids, not the source', () => {
		const cloned = duplicateWorkflow(source, makeMinter());
		for (const e of cloned.edges) {
			expect(cloned.nodes.some(n => n.id === e.source)).toBe(true);
			expect(cloned.nodes.some(n => n.id === e.target)).toBe(true);
		}
	});

	it('uses base name when existingNames does not collide', () => {
		const cloned = duplicateWorkflow(source, makeMinter(), { existingNames: ['Unrelated'] });
		expect(cloned.name).toBe('Copy of Original');
	});

	it('appends a (2) suffix when "Copy of …" already exists', () => {
		const cloned = duplicateWorkflow(source, makeMinter(), { existingNames: ['Copy of Original'] });
		expect(cloned.name).toBe('Copy of Original (2)');
	});

	it('walks up the suffix until a free slot is found', () => {
		const cloned = duplicateWorkflow(source, makeMinter(), {
			existingNames: ['Copy of Original', 'Copy of Original (2)', 'Copy of Original (3)'],
		});
		expect(cloned.name).toBe('Copy of Original (4)');
	});

	it('compares names case-insensitively', () => {
		const cloned = duplicateWorkflow(source, makeMinter(), { existingNames: ['copy of original'] });
		expect(cloned.name).toBe('Copy of Original (2)');
	});
});

describe('findWorkflowByName', () => {
	const wfs: WorkflowFile[] = [
		{ id: 'a', name: 'Auth chain', nodes: [], edges: [] },
		{ id: 'b', name: 'Smoke test', nodes: [], edges: [] },
	];

	it('matches case-insensitively', () => {
		expect(findWorkflowByName(wfs, 'AUTH CHAIN')?.id).toBe('a');
	});

	it('trims whitespace before comparing', () => {
		expect(findWorkflowByName(wfs, '   smoke test  ')?.id).toBe('b');
	});

	it('returns null when nothing matches', () => {
		expect(findWorkflowByName(wfs, 'Missing')).toBeNull();
	});

	it('returns null for an empty needle', () => {
		expect(findWorkflowByName(wfs, '   ')).toBeNull();
	});

	it('accepts a record (id → file)', () => {
		const record: Record<string, WorkflowFile> = {};
		for (const w of wfs) record[w.id] = w;
		expect(findWorkflowByName(record, 'Auth chain')?.id).toBe('a');
	});
});

describe('uniqueWorkflowName', () => {
	it('returns the base when no collision', () => {
		expect(uniqueWorkflowName('Authy', ['Auth chain'])).toBe('Authy');
	});

	it('handles repeated collisions by walking the counter', () => {
		expect(uniqueWorkflowName('Auth', ['Auth', 'Auth (2)'])).toBe('Auth (3)');
	});

	it('trims and lowercases for comparison', () => {
		expect(uniqueWorkflowName('Auth', ['  AUTH  '])).toBe('Auth (2)');
	});
});

describe('findRequestStepsUsing', () => {
	const wfA: WorkflowFile = {
		id: 'a',
		name: 'A',
		nodes: [
			{ id: 'n1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-1' } },
			{ id: 'n2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-2' } },
		],
		edges: [],
	};
	const wfB: WorkflowFile = {
		id: 'b',
		name: 'B',
		nodes: [
			{ id: 'n3', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-1' } },
			{ id: 'n4', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
		],
		edges: [],
	};

	it('returns every {workflowId, nodeId} touching the request', () => {
		expect(findRequestStepsUsing([wfA, wfB], 'req-1').sort((a, b) => a.nodeId.localeCompare(b.nodeId))).toEqual([
			{ workflowId: 'a', nodeId: 'n1' },
			{ workflowId: 'b', nodeId: 'n3' },
		]);
	});

	it('returns [] when the request is never referenced', () => {
		expect(findRequestStepsUsing([wfA, wfB], 'req-ghost')).toEqual([]);
	});

	it('accepts a record input', () => {
		expect(findRequestStepsUsing({ a: wfA, b: wfB }, 'req-2')).toEqual([{ workflowId: 'a', nodeId: 'n2' }]);
	});

	it('does not count unlinked request nodes', () => {
		expect(findRequestStepsUsing([wfB], 'req-1')).toEqual([{ workflowId: 'b', nodeId: 'n3' }]);
		// n4 has requestId === null, not 'req-1'.
	});
});

describe('findSourcesOf / findTargetsOf', () => {
	const wf: WorkflowFile = {
		id: 'wf',
		name: 'hop',
		nodes: [
			{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
			{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			{ id: 'c', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
		],
		edges: [
			{ id: 'e1', source: 's', target: 'a' },
			{ id: 'e2', source: 'b', target: 'a' },
			{ id: 'e3', source: 'a', target: 'c' },
			{ id: 'e4', source: 'a', target: 'a' }, // self-loop
		],
	};

	it('findSourcesOf returns the unique inbound nodes', () => {
		expect(findSourcesOf(wf, 'a').sort()).toEqual(['b', 's']);
	});

	it('findTargetsOf returns the unique outbound nodes', () => {
		expect(findTargetsOf(wf, 'a')).toEqual(['c']);
	});

	it('returns [] when the node has no predecessors/successors', () => {
		expect(findSourcesOf(wf, 's')).toEqual([]);
		expect(findTargetsOf(wf, 'c')).toEqual([]);
	});
});

describe('recentWorkflows', () => {
	const make = (id: string, updatedAt?: number): WorkflowFile => ({
		id,
		name: id.toUpperCase(),
		updatedAt,
		nodes: [],
		edges: [],
	});

	it('sorts by updatedAt descending', () => {
		const wfs = [make('a', 100), make('b', 300), make('c', 200)];
		expect(recentWorkflows(wfs).map(w => w.id)).toEqual(['b', 'c', 'a']);
	});

	it('places undefined-updatedAt last in insertion order', () => {
		const wfs = [make('a', 100), make('b'), make('c', 200), make('d')];
		expect(recentWorkflows(wfs).map(w => w.id)).toEqual(['c', 'a', 'b', 'd']);
	});

	it('honours limit', () => {
		const wfs = [make('a', 100), make('b', 300), make('c', 200)];
		expect(recentWorkflows(wfs, 2).map(w => w.id)).toEqual(['b', 'c']);
	});

	it('accepts a record input', () => {
		const wfs = { a: make('a', 100), b: make('b', 300) };
		expect(recentWorkflows(wfs).map(w => w.id)).toEqual(['b', 'a']);
	});

	it('does not mutate the input array', () => {
		const wfs = [make('a', 100), make('b', 300)];
		const original = [...wfs];
		recentWorkflows(wfs);
		expect(wfs).toEqual(original);
	});
});

describe('extractAllTags', () => {
	it('flattens + dedupes + sorts tags from an array', () => {
		const wfs: WorkflowFile[] = [
			{ id: 'a', name: 'A', tags: ['auth', 'staging'], nodes: [], edges: [] },
			{ id: 'b', name: 'B', tags: ['staging', 'smoke'], nodes: [], edges: [] },
			{ id: 'c', name: 'C', nodes: [], edges: [] },
		];
		expect(extractAllTags(wfs)).toEqual(['auth', 'smoke', 'staging']);
	});

	it('accepts a record (workflow id → file)', () => {
		expect(
			extractAllTags({
				a: { id: 'a', name: 'A', tags: ['x'], nodes: [], edges: [] },
				b: { id: 'b', name: 'B', tags: ['y'], nodes: [], edges: [] },
			}),
		).toEqual(['x', 'y']);
	});

	it('returns [] when nothing has tags', () => {
		expect(extractAllTags([{ id: 'a', name: 'A', nodes: [], edges: [] }])).toEqual([]);
	});
});

describe('completionRatio', () => {
	function reqNode(id: string, linked: boolean): WorkflowNode {
		return { id, type: 'request', position: { x: 0, y: 0 }, data: { requestId: linked ? `req-${id}` : null } };
	}

	it('returns 1 when there are no request nodes (vacuous)', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		expect(completionRatio(wf)).toBe(1);
	});

	it('returns the linked / total ratio when all requests are linked', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [reqNode('a', true), reqNode('b', true)],
			edges: [],
		};
		expect(completionRatio(wf)).toBe(1);
	});

	it('returns 0 when none are linked', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [reqNode('a', false), reqNode('b', false)],
			edges: [],
		};
		expect(completionRatio(wf)).toBe(0);
	});

	it('returns the partial linked / total ratio', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [reqNode('a', true), reqNode('b', false), reqNode('c', false), reqNode('d', false)],
			edges: [],
		};
		expect(completionRatio(wf)).toBeCloseTo(0.25);
	});

	it('ignores non-request nodes in both numerator and denominator', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				reqNode('a', true),
				{ id: 'c', type: 'comment', position: { x: 0, y: 0 }, data: { text: 'note' } },
			],
			edges: [],
		};
		expect(completionRatio(wf)).toBe(1);
	});
});

describe('firstUnlinkedRequest', () => {
	function reqNode(id: string, linked: boolean): WorkflowNode {
		return { id, type: 'request', position: { x: 0, y: 0 }, data: { requestId: linked ? `req-${id}` : null } };
	}

	it('returns the first unlinked node id in insertion order', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [reqNode('a', true), reqNode('b', false), reqNode('c', false)],
			edges: [],
		};
		expect(firstUnlinkedRequest(wf)).toBe('b');
	});

	it('returns null when every request node is linked', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [reqNode('a', true)],
			edges: [],
		};
		expect(firstUnlinkedRequest(wf)).toBeNull();
	});

	it('returns null when the workflow has no request nodes', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		expect(firstUnlinkedRequest(wf)).toBeNull();
	});
});

describe('linkedRequestIds', () => {
	it('returns distinct ids in first-appearance order', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-A' } },
				{ id: 'r2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-B' } },
				{ id: 'r3', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-A' } },
			],
			edges: [],
		};
		expect(linkedRequestIds(wf)).toEqual(['req-A', 'req-B']);
	});

	it('skips unlinked request nodes', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [
				{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'r2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-A' } },
			],
			edges: [],
		};
		expect(linkedRequestIds(wf)).toEqual(['req-A']);
	});

	it('ignores non-request nodes', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'c', type: 'comment', position: { x: 0, y: 0 }, data: { text: 'hi' } },
			],
			edges: [],
		};
		expect(linkedRequestIds(wf)).toEqual([]);
	});
});

describe('parentIdsUsed', () => {
	it('returns the distinct parent ids sorted', () => {
		const wfs: WorkflowFile[] = [
			{ id: 'a', name: 'A', parent: 'folder-2', nodes: [], edges: [] },
			{ id: 'b', name: 'B', parent: 'folder-1', nodes: [], edges: [] },
			{ id: 'c', name: 'C', parent: 'folder-1', nodes: [], edges: [] },
		];
		expect(parentIdsUsed(wfs)).toEqual(['folder-1', 'folder-2']);
	});

	it('excludes root-level workflows', () => {
		const wfs: WorkflowFile[] = [
			{ id: 'a', name: 'A', nodes: [], edges: [] },
			{ id: 'b', name: 'B', parent: '', nodes: [], edges: [] },
			{ id: 'c', name: 'C', parent: '  ', nodes: [], edges: [] },
		];
		expect(parentIdsUsed(wfs)).toEqual([]);
	});
});

describe('groupWorkflowsByParent', () => {
	const wfs: WorkflowFile[] = [
		{ id: 'a', name: 'A', parent: 'folder-1', nodes: [], edges: [] },
		{ id: 'b', name: 'B', nodes: [], edges: [] },
		{ id: 'c', name: 'C', parent: 'folder-1', nodes: [], edges: [] },
		{ id: 'd', name: 'D', parent: 'folder-2', nodes: [], edges: [] },
	];

	it('puts root workflows under the empty-string bucket first', () => {
		const map = groupWorkflowsByParent(wfs);
		expect([...map.keys()][0]).toBe('');
		expect(map.get('')!.map(w => w.id)).toEqual(['b']);
	});

	it('groups same-parent workflows together', () => {
		const map = groupWorkflowsByParent(wfs);
		expect(map.get('folder-1')!.map(w => w.id)).toEqual(['a', 'c']);
		expect(map.get('folder-2')!.map(w => w.id)).toEqual(['d']);
	});

	it('preserves insertion order for nested parents', () => {
		const map = groupWorkflowsByParent(wfs);
		expect([...map.keys()].slice(1)).toEqual(['folder-1', 'folder-2']);
	});

	it('skips the empty-string bucket when every workflow has a parent', () => {
		const onlyNested: WorkflowFile[] = [{ id: 'a', name: 'A', parent: 'f', nodes: [], edges: [] }];
		expect(groupWorkflowsByParent(onlyNested).has('')).toBe(false);
	});

	it('treats whitespace-only parents as no parent', () => {
		const messy: WorkflowFile[] = [
			{ id: 'a', name: 'A', parent: '   ', nodes: [], edges: [] },
			{ id: 'b', name: 'B', parent: undefined, nodes: [], edges: [] },
		];
		const map = groupWorkflowsByParent(messy);
		expect(map.get('')!.map(w => w.id)).toEqual(['a', 'b']);
	});

	it('accepts a record', () => {
		const record: Record<string, WorkflowFile> = {};
		for (const w of wfs) record[w.id] = w;
		const map = groupWorkflowsByParent(record);
		expect(map.size).toBe(3);
	});
});

describe('findDuplicateNames', () => {
	it('returns colliding workflows grouped by trimmed lowercase name', () => {
		const wfs: WorkflowFile[] = [
			{ id: 'a', name: 'Auth chain', nodes: [], edges: [] },
			{ id: 'b', name: '  auth chain  ', nodes: [], edges: [] },
			{ id: 'c', name: 'Smoke test', nodes: [], edges: [] },
			{ id: 'd', name: 'AUTH CHAIN', nodes: [], edges: [] },
		];
		const result = findDuplicateNames(wfs);
		expect(result).toEqual([{ name: 'Auth chain', ids: ['a', 'b', 'd'] }]);
	});

	it('returns [] when no names collide', () => {
		expect(
			findDuplicateNames([
				{ id: 'a', name: 'A', nodes: [], edges: [] },
				{ id: 'b', name: 'B', nodes: [], edges: [] },
			]),
		).toEqual([]);
	});

	it('skips workflows with blank names', () => {
		expect(
			findDuplicateNames([
				{ id: 'a', name: '', nodes: [], edges: [] },
				{ id: 'b', name: '   ', nodes: [], edges: [] },
			]),
		).toEqual([]);
	});

	it('returns groups sorted alphabetically by display name', () => {
		const wfs: WorkflowFile[] = [
			{ id: 'a', name: 'Zeta', nodes: [], edges: [] },
			{ id: 'b', name: 'Zeta', nodes: [], edges: [] },
			{ id: 'c', name: 'Alpha', nodes: [], edges: [] },
			{ id: 'd', name: 'Alpha', nodes: [], edges: [] },
		];
		const result = findDuplicateNames(wfs);
		expect(result.map(r => r.name)).toEqual(['Alpha', 'Zeta']);
	});
});

describe('summariseHealth', () => {
	function emptyHealth() {
		return {
			nodeCount: 0,
			edgeCount: 0,
			reachable: new Set<string>(),
			unreachable: [],
			danglingEdges: [],
			unlinkedRequestNodes: [],
			cycleNodes: [],
		};
	}

	it('returns null when everything is clean', () => {
		expect(summariseHealth(emptyHealth(), 0)).toBeNull();
	});

	it('joins per-category lines with commas in stable order', () => {
		const h = emptyHealth();
		h.unreachable = ['a', 'b'];
		h.cycleNodes = ['c', 'd', 'e'];
		h.unlinkedRequestNodes = ['f'];
		expect(summariseHealth(h, 2)).toBe('2 unreachable, 3 cycle members, 1 unlinked request, 2 warnings');
	});

	it('uses singular form for count of 1', () => {
		const h = emptyHealth();
		h.cycleNodes = ['x'];
		expect(summariseHealth(h, 1)).toBe('1 cycle member, 1 warning');
	});

	it('omits categories with zero counts', () => {
		const h = emptyHealth();
		h.unreachable = ['x'];
		expect(summariseHealth(h, 0)).toBe('1 unreachable');
	});
});

describe('tagCount', () => {
	it('returns the distinct tag count across a collection', () => {
		const wfs: WorkflowFile[] = [
			{ id: 'a', name: 'A', tags: ['auth', 'staging'], nodes: [], edges: [] },
			{ id: 'b', name: 'B', tags: ['staging', 'smoke'], nodes: [], edges: [] },
		];
		expect(tagCount(wfs)).toBe(3);
	});

	it('returns 0 when no workflows declare tags', () => {
		expect(tagCount([{ id: 'a', name: 'A', nodes: [], edges: [] }])).toBe(0);
	});

	it('matches extractAllTags().length', () => {
		const wfs: WorkflowFile[] = [
			{ id: 'a', name: 'A', tags: ['x', 'y', 'z'], nodes: [], edges: [] },
			{ id: 'b', name: 'B', tags: ['y'], nodes: [], edges: [] },
		];
		expect(tagCount(wfs)).toBe(extractAllTags(wfs).length);
	});
});

describe('unusedTags', () => {
	const wfs: WorkflowFile[] = [
		{ id: 'a', name: 'A', tags: ['auth', 'staging'], nodes: [], edges: [] },
		{ id: 'b', name: 'B', tags: ['staging', 'smoke'], nodes: [], edges: [] },
	];

	it('returns the tags from `known` that no workflow uses', () => {
		expect(unusedTags(wfs, ['auth', 'staging', 'smoke', 'legacy', 'experiment'])).toEqual(['experiment', 'legacy']);
	});

	it('drops empty + duplicate entries from known', () => {
		expect(unusedTags(wfs, ['legacy', '', '   ', 'legacy', 'LEGACY'])).toEqual(['legacy']);
	});

	it('returns [] when every known tag is in use', () => {
		expect(unusedTags(wfs, ['auth', 'staging', 'smoke'])).toEqual([]);
	});

	it('handles the empty-known case as []', () => {
		expect(unusedTags(wfs, [])).toEqual([]);
	});

	it('compares case-insensitively', () => {
		expect(unusedTags(wfs, ['AUTH'])).toEqual([]);
	});
});

describe('workflowsByTag', () => {
	const wfs: WorkflowFile[] = [
		{ id: 'a', name: 'A', tags: ['auth', 'staging'], nodes: [], edges: [] },
		{ id: 'b', name: 'B', tags: ['staging', 'smoke'], nodes: [], edges: [] },
		{ id: 'c', name: 'C', nodes: [], edges: [] },
	];

	it('groups workflows under every tag they declare', () => {
		const map = workflowsByTag(wfs);
		expect(map.get('auth')!.map(w => w.id)).toEqual(['a']);
		expect(map.get('smoke')!.map(w => w.id)).toEqual(['b']);
		expect(map.get('staging')!.map(w => w.id).sort()).toEqual(['a', 'b']);
	});

	it('buckets untagged workflows under the empty-string key', () => {
		const map = workflowsByTag(wfs);
		expect(map.get('')!.map(w => w.id)).toEqual(['c']);
	});

	it('omits the empty-string bucket when every workflow has tags', () => {
		const tagged: WorkflowFile[] = [{ id: 'x', name: 'X', tags: ['t'], nodes: [], edges: [] }];
		expect(workflowsByTag(tagged).has('')).toBe(false);
	});

	it('preserves tag iteration order — alphabetical, then untagged last', () => {
		const map = workflowsByTag(wfs);
		expect([...map.keys()]).toEqual(['auth', 'smoke', 'staging', '']);
	});

	it('accepts a record as well as an array', () => {
		const record: Record<string, WorkflowFile> = {};
		for (const w of wfs) record[w.id] = w;
		expect([...workflowsByTag(record).keys()]).toEqual(['auth', 'smoke', 'staging', '']);
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

	it('matches by node id substring as a fallback', () => {
		const results = searchNodes(wf, 'r1', names);
		expect(results.map(r => r.id)).toContain('r1');
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

describe('searchWorkflows', () => {
	function wf(id: string, name: string, extras: Partial<WorkflowFile> = {}): WorkflowFile {
		return {
			id,
			name,
			nodes: [{ id: `${id}-start`, type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
			...extras,
		};
	}

	const collection = {
		'wf-1': wf('wf-1', 'Auth chain', { description: 'OAuth token dance', tags: ['auth', 'critical'] }),
		'wf-2': wf('wf-2', 'Smoke test', { tags: ['ci', 'smoke'] }),
		'wf-3': wf('wf-3', 'Internal report'),
		'wf-4': wf('wf-4', 'Authoring'),
	};

	it('returns every entry in alphabetical order for an empty query', () => {
		const result = searchWorkflows(collection, '   ');
		expect(result.map(r => r.name)).toEqual(['Auth chain', 'Authoring', 'Internal report', 'Smoke test']);
	});

	it('prefers prefix matches over substring matches', () => {
		const result = searchWorkflows(collection, 'auth');
		expect(result.map(r => r.id)).toEqual(['wf-1', 'wf-4']);
	});

	it('matches exact tag with mid-tier score above description-substring', () => {
		const result = searchWorkflows(collection, 'critical');
		expect(result.map(r => r.id)).toEqual(['wf-1']);
	});

	it('matches description substring when name and tags miss', () => {
		const result = searchWorkflows(collection, 'token');
		expect(result.map(r => r.id)).toEqual(['wf-1']);
	});

	it('falls back to id substring as a last resort', () => {
		const result = searchWorkflows(collection, 'wf-3');
		expect(result.map(r => r.id)).toEqual(['wf-3']);
	});

	it('returns no matches when nothing fits', () => {
		expect(searchWorkflows(collection, 'xyzzy-no-match')).toEqual([]);
	});

	it('accepts a list as well as a record', () => {
		const list = Object.values(collection);
		expect(searchWorkflows(list, 'smoke').map(r => r.id)).toEqual(['wf-2']);
	});

	it('shows the description and tags in the subtitle', () => {
		const result = searchWorkflows(collection, 'auth chain');
		expect(result[0].subtitle).toBe('OAuth token dance · #auth #critical');
	});

	it('falls back to "Untitled workflow" when name is blank', () => {
		const blank: Record<string, WorkflowFile> = { 'wf-x': wf('wf-x', '   ') };
		expect(searchWorkflows(blank, '').map(r => r.name)).toEqual(['Untitled workflow']);
	});
});

describe('formatRelativeTime', () => {
	const now = 1_700_000_000_000;

	it('returns "just now" for differences under a minute', () => {
		expect(formatRelativeTime(now - 5_000, now)).toBe('just now');
		expect(formatRelativeTime(now - 59_000, now)).toBe('just now');
	});

	it('returns minutes between 1m and 59m', () => {
		expect(formatRelativeTime(now - 60_000, now)).toBe('1m ago');
		expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m ago');
	});

	it('returns hours between 1h and 23h', () => {
		expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe('3h ago');
		expect(formatRelativeTime(now - 23 * 3_600_000, now)).toBe('23h ago');
	});

	it('returns days for 1d to 29d', () => {
		expect(formatRelativeTime(now - 2 * 86_400_000, now)).toBe('2d ago');
	});

	it('returns months between 1mo and 11mo', () => {
		expect(formatRelativeTime(now - 60 * 86_400_000, now)).toBe('2mo ago');
	});

	it('returns years past 12 months', () => {
		expect(formatRelativeTime(now - 400 * 86_400_000, now)).toBe('1y ago');
	});

	it('clamps negatives to "just now" — never lies about the future', () => {
		expect(formatRelativeTime(now + 1000, now)).toBe('just now');
	});
});

describe('workflowDepth', () => {
	function startOnly(): WorkflowFile {
		return {
			id: 'wf',
			name: '',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
	}

	it('returns 0 for a Start-only workflow', () => {
		expect(workflowDepth(startOnly())).toBe(0);
	});

	it('counts edges along the longest path', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
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
			],
		};
		expect(workflowDepth(wf)).toBe(3);
	});

	it('takes the max of branching paths', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'c', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'a', target: 'b' },
				{ id: 'e3', source: 's', target: 'c' },
			],
		};
		expect(workflowDepth(wf)).toBe(2);
	});

	it('returns Infinity when a cycle is reachable from Start', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
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
		expect(workflowDepth(wf)).toBe(Number.POSITIVE_INFINITY);
	});

	it('ignores edges pointing at missing nodes', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [{ id: 'e1', source: 's', target: 'ghost' }],
		};
		expect(workflowDepth(wf)).toBe(0);
	});
});

describe('findIsolatedNodes', () => {
	it('returns non-Start nodes with no edges', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'c', type: 'comment', position: { x: 0, y: 0 }, data: { text: '' } },
			],
			edges: [{ id: 'e1', source: 's', target: 'a' }],
		};
		expect(findIsolatedNodes(wf).sort()).toEqual(['b', 'c']);
	});

	it('never lists Start as isolated even when it has no edges', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		expect(findIsolatedNodes(wf)).toEqual([]);
	});

	it('counts a node as connected if it is referenced as source OR target', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: '',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [{ id: 'e1', source: 'a', target: 's' }],
		};
		expect(findIsolatedNodes(wf)).toEqual([]);
	});
});
