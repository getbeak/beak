import { describe, expect, it } from 'vitest';

import {
	autoLayout,
	cloneNodeAt,
	countOverrideEntries,
	edgesAfterNodeRemoval,
	inspectGraph,
	overrideBadgeText,
	placeNewNode,
	previewValueSections,
	readPlainText,
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
		const p = placeNewNode([
			{ position: { x: 100, y: 50 } },
			{ position: { x: 300, y: 50 } },
			{ position: { x: 300, y: 200 } },
		], 20);
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
			nodes: [
				{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } } as WorkflowNode,
			],
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
