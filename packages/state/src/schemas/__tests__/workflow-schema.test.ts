import { describe, expect, it } from 'vitest';

import { workflowSchema } from '../beak-workflow';

/**
 * Round-trip a maxed-out workflow through the Zod schema. Catches drift
 * between the editor's interfaces (in `state/workflows/types.ts`) and the
 * canonical on-disk shape (this file's schema).
 *
 * If a node kind grows a new field and the schema isn't updated, parse
 * fails here loudly; if the schema gains an optional field that the
 * editor doesn't emit, we still parse cleanly. Either way the renderer
 * and the host stay in lockstep with the file format.
 */

describe('workflowSchema — round-trip', () => {
	it('accepts a maxed-out workflow with every node kind', () => {
		const wf = {
			id: 'wf-1',
			name: 'Round-trip',
			parent: null,
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{
					id: 'r1',
					type: 'request',
					position: { x: 200, y: 0 },
					data: {
						requestId: 'req-a',
						overrides: {
							headers: { h1: { value: ['x'] }, h2: { enabled: false } },
							query: { q1: { value: ['y'] } },
							body: {
								fields: { f1: { value: ['z'] } },
								raw: { contentType: 'application/json', text: ['{}'] },
							},
							fragment: ['#frag'],
						},
					},
				},
				{
					id: 'l1',
					type: 'loop',
					position: { x: 400, y: 0 },
					data: { mode: 'count', count: 3 },
				},
				{
					id: 'l2',
					type: 'loop',
					position: { x: 400, y: 150 },
					data: { mode: 'forEach', forEach: ['$.body.items'] },
				},
				{
					id: 'c1',
					type: 'condition',
					position: { x: 600, y: 0 },
					data: { leftPath: 'body.user.id', operator: 'equals', right: ['1'] },
				},
				{
					id: 'c2',
					type: 'condition',
					position: { x: 600, y: 150 },
					data: { operator: 'truthy' },
				},
				{
					id: 'n1',
					type: 'notification',
					position: { x: 800, y: 0 },
					data: { title: ['done'], body: ['ok'] },
				},
				{
					id: 'cm1',
					type: 'comment',
					position: { x: 1000, y: 0 },
					data: { text: 'Reminder: assumes auth header is set upstream.' },
				},
			],
			edges: [
				{ id: 'e1', source: 's', target: 'r1' },
				{ id: 'e2', source: 'r1', target: 'l1', sourceHandle: null, targetHandle: null },
				{ id: 'e3', source: 'l1', target: 'c1', sourceHandle: 'body' },
				{ id: 'e4', source: 'c1', target: 'n1', sourceHandle: 'true' },
			],
		};

		// JSON round-trip first to confirm the structure is serialisable.
		const wire = JSON.parse(JSON.stringify(wf));
		const parsed = workflowSchema.parse(wire);
		expect(parsed.id).toBe('wf-1');
		expect(parsed.nodes).toHaveLength(8);
		expect(parsed.edges).toHaveLength(4);
	});

	it('accepts a comment node with empty text', () => {
		const wf = {
			id: 'wf-6',
			name: 'Empty comment',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'cm', type: 'comment', position: { x: 100, y: 100 }, data: {} },
			],
			edges: [],
		};
		const parsed = workflowSchema.parse(wf);
		const comment = parsed.nodes.find(n => n.type === 'comment')!;
		expect((comment.data as { text?: string }).text).toBeUndefined();
	});

	it('rejects an unknown node kind', () => {
		const wf = {
			id: 'wf-2',
			name: 'Bad kind',
			nodes: [{ id: 'a', type: 'mystery', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		expect(() => workflowSchema.parse(wf)).toThrow();
	});

	it('rejects an unknown top-level key (strict schema)', () => {
		const wf = {
			id: 'wf-3',
			name: 'Strict',
			nodes: [],
			edges: [],
			somethingWeird: 'rogue',
		};
		expect(() => workflowSchema.parse(wf)).toThrow();
	});

	it('accepts a workflow without a parent (omitted)', () => {
		const wf = {
			id: 'wf-4',
			name: 'No parent',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		const parsed = workflowSchema.parse(wf);
		expect(parsed.parent).toBeUndefined();
	});

	it('accepts an optional version field', () => {
		const wf = {
			version: '1',
			id: 'wf-v',
			name: 'with version',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		expect(workflowSchema.parse(wf).version).toBe('1');
	});

	it('parses workflows without a version (pre-version files)', () => {
		const wf = {
			id: 'wf-no-v',
			name: 'no version',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		expect(workflowSchema.parse(wf).version).toBeUndefined();
	});

	it('accepts an optional tags array', () => {
		const wf = {
			id: 'wf-tags',
			name: 'tagged',
			tags: ['auth', 'staging'],
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		expect(workflowSchema.parse(wf).tags).toEqual(['auth', 'staging']);
	});

	it('accepts an optional workflow description', () => {
		const wf = {
			id: 'wf-desc',
			name: 'with desc',
			description: 'Some doc text.',
			nodes: [{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		};
		expect(workflowSchema.parse(wf).description).toBe('Some doc text.');
	});

	it('accepts a per-node display name', () => {
		const wf = {
			id: 'wf-name',
			name: 'named',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, name: 'Begin', data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, name: 'Login', data: { requestId: null } },
			],
			edges: [],
		};
		const parsed = workflowSchema.parse(wf);
		expect(parsed.nodes[0].name).toBe('Begin');
		expect(parsed.nodes[1].name).toBe('Login');
	});

	it('accepts an edge with an inline label', () => {
		const wf = {
			id: 'wf-7',
			name: 'labelled edges',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [{ id: 'e1', source: 's', target: 'a', label: 'happy path' }],
		};
		const parsed = workflowSchema.parse(wf);
		expect(parsed.edges[0].label).toBe('happy path');
	});

	it('treats request overrides as fully optional', () => {
		const wf = {
			id: 'wf-5',
			name: 'No overrides',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } },
			],
			edges: [],
		};
		const parsed = workflowSchema.parse(wf);
		const request = parsed.nodes.find(n => n.type === 'request')!;
		expect((request.data as { overrides?: unknown }).overrides).toBeUndefined();
	});
});
