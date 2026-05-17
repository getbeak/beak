import { describe, expect, it } from 'vitest';

import { workflowStats } from '../stats';
import { instantiateTemplate, type TemplateKey } from '../templates';
import type { WorkflowFile, WorkflowNode } from '../types';

function counterMinter() {
	const counts: Record<string, number> = {};
	return (prefix: 'workflow' | 'node' | 'edge') => {
		counts[prefix] = (counts[prefix] ?? 0) + 1;
		return `${prefix}-${counts[prefix]}`;
	};
}

describe('workflowStats', () => {
	it('reports zero counts for an empty workflow', () => {
		const stats = workflowStats({ id: 'wf', name: '', nodes: [], edges: [] });
		expect(stats.nodesByKind).toEqual({
			start: 0,
			request: 0,
			loop: 0,
			condition: 0,
			notification: 0,
			comment: 0,
		});
		expect(stats.edgeCount).toBe(0);
		expect(stats.edgesByHandle).toEqual({});
		expect(stats.componentCount).toBe(0);
		expect(stats.linkedRequestCount).toBe(0);
		expect(stats.unlinkedRequestCount).toBe(0);
	});

	it('counts every node kind and splits request linkage', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'mixed',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
				{ id: 'r2', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'l', type: 'loop', position: { x: 0, y: 0 }, data: { mode: 'count', count: 3 } },
				{ id: 'c', type: 'condition', position: { x: 0, y: 0 }, data: { operator: 'truthy' } },
				{ id: 'n', type: 'notification', position: { x: 0, y: 0 }, data: {} },
				{ id: 'cm', type: 'comment', position: { x: 0, y: 0 }, data: { text: 'note' } },
			] as WorkflowNode[],
			edges: [],
		};
		const stats = workflowStats(wf);
		expect(stats.nodesByKind.start).toBe(1);
		expect(stats.nodesByKind.request).toBe(2);
		expect(stats.nodesByKind.loop).toBe(1);
		expect(stats.nodesByKind.condition).toBe(1);
		expect(stats.nodesByKind.notification).toBe(1);
		expect(stats.nodesByKind.comment).toBe(1);
		expect(stats.linkedRequestCount).toBe(1);
		expect(stats.unlinkedRequestCount).toBe(1);
	});

	it('groups edges by sourceHandle (empty string for unhandled)', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'wired',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'l', type: 'loop', position: { x: 0, y: 0 }, data: { mode: 'count', count: 1 } },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			] as WorkflowNode[],
			edges: [
				{ id: 'e1', source: 's', target: 'l' },
				{ id: 'e2', source: 'l', target: 'a', sourceHandle: 'body' },
				{ id: 'e3', source: 'l', target: 'b', sourceHandle: 'after' },
			],
		};
		const stats = workflowStats(wf);
		expect(stats.edgesByHandle).toEqual({ '': 1, body: 1, after: 1 });
		expect(stats.edgeCount).toBe(3);
	});

	it('templates report sensible stats', () => {
		const cases: { template: TemplateKey; expect: { start: number; request: number; loop: number; notification: number } }[] = [
			{ template: 'blank', expect: { start: 1, request: 0, loop: 0, notification: 0 } },
			{ template: 'smoke-test', expect: { start: 1, request: 1, loop: 0, notification: 1 } },
			{ template: 'auth-chain', expect: { start: 1, request: 2, loop: 0, notification: 0 } },
			{ template: 'paginated-fetch', expect: { start: 1, request: 1, loop: 1, notification: 0 } },
		];
		for (const c of cases) {
			const wf = instantiateTemplate({ template: c.template, name: 't', mintId: counterMinter() });
			const stats = workflowStats(wf);
			expect(stats.nodesByKind.start).toBe(c.expect.start);
			expect(stats.nodesByKind.request).toBe(c.expect.request);
			expect(stats.nodesByKind.loop).toBe(c.expect.loop);
			expect(stats.nodesByKind.notification).toBe(c.expect.notification);
		}
	});

	it('reports connected-component count', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'split',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			] as WorkflowNode[],
			edges: [{ id: 'e1', source: 'a', target: 'b' }],
		};
		expect(workflowStats(wf).componentCount).toBe(2);
	});
});
