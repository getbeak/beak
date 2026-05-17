import { describe, expect, it } from 'vitest';

import { toMarkdown } from '../markdown';
import type { WorkflowFile, WorkflowNode } from '../types';

describe('toMarkdown', () => {
	it('renders an empty-workflow placeholder', () => {
		const md = toMarkdown({ id: 'wf', name: '', nodes: [], edges: [] });
		expect(md).toContain('Untitled workflow');
		expect(md).toContain('_Empty workflow._');
	});

	it('lists every node with a kind badge', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'Mixed',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'r', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
				{ id: 'l', type: 'loop', position: { x: 0, y: 0 }, data: { mode: 'count', count: 3 } },
				{ id: 'c', type: 'condition', position: { x: 0, y: 0 }, data: { operator: 'truthy' } },
				{ id: 'n', type: 'notification', position: { x: 0, y: 0 }, data: { title: ['hi'] } },
				{ id: 'cm', type: 'comment', position: { x: 0, y: 0 }, data: { text: 'note' } },
			] as WorkflowNode[],
			edges: [],
		};
		const md = toMarkdown(wf, new Map([['req-a', 'GET /users']]));
		expect(md).toContain('# Mixed');
		expect(md).toContain('**Start**');
		expect(md).toContain('**Request** — GET /users');
		expect(md).toContain('**Loop** — repeat 3 ×');
		expect(md).toContain('**If** — if incoming value truthy');
		expect(md).toContain('**Notify** — "hi"');
		expect(md).toContain('**Note** — note');
	});

	it('falls back to "no linked request" for unlinked request nodes', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'unlinked',
			nodes: [{ id: 'r', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } }],
			edges: [],
		};
		const md = toMarkdown(wf);
		expect(md).toContain('_(no linked request)_');
	});

	it('renders the connections section with handles + labels', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'wired',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'l', type: 'loop', position: { x: 0, y: 0 }, data: { mode: 'count', count: 2 } },
				{ id: 'r', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
			] as WorkflowNode[],
			edges: [
				{ id: 'e1', source: 's', target: 'l' },
				{ id: 'e2', source: 'l', target: 'r', sourceHandle: 'body', label: 'each iteration' },
			],
		};
		const md = toMarkdown(wf, new Map([['req-a', 'POST /metrics']]));
		expect(md).toContain('## Connections');
		expect(md).toContain('Workflow entry point → repeat 2 ×');
		expect(md).toContain('repeat 2 × (body) → POST /metrics — _each iteration_');
	});

	it('includes the workflow description when set', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'with desc',
			description: 'Runs the smoke test against staging.',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		const md = toMarkdown(wf);
		expect(md).toContain('Runs the smoke test against staging.');
	});

	it('renders edge labels with italic emphasis', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'labelled',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [{ id: 'e1', source: 's', target: 'a', label: 'happy path' }],
		};
		const md = toMarkdown(wf);
		expect(md).toContain('— _happy path_');
	});

	it('prefers an explicit node name over the derived label', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'named',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' }, name: 'Login flow' } as WorkflowNode,
			],
			edges: [],
		};
		const md = toMarkdown(wf, new Map([['req-a', 'POST /sessions']]));
		expect(md).toContain('**Request** — Login flow');
		expect(md).not.toContain('POST /sessions');
	});

	it('marks dangling edge endpoints rather than crashing', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'dangling',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [{ id: 'e1', source: 's', target: 'ghost' }],
		};
		const md = toMarkdown(wf);
		expect(md).toContain('Workflow entry point → (missing ghost');
	});
});
