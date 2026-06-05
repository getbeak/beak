import { describe, expect, it } from 'vitest';

import { diffWorkflows, summariseChange } from '../diff';
import type { WorkflowFile } from '../types';

const baseStart = { id: 's', type: 'start' as const, position: { x: 0, y: 0 }, data: {} };

function makeWorkflow(overrides: Partial<WorkflowFile> = {}): WorkflowFile {
	return {
		id: 'wf',
		name: 'baseline',
		nodes: [baseStart],
		edges: [],
		...overrides,
	};
}

describe('diffWorkflows', () => {
	it('reports no changes for an identical workflow', () => {
		const wf = makeWorkflow({
			nodes: [baseStart, { id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } }],
			edges: [{ id: 'e1', source: 's', target: 'a' }],
		});
		expect(diffWorkflows(wf, wf)).toEqual({
			addedNodes: [],
			removedNodes: [],
			modifiedNodes: [],
			addedEdges: [],
			removedEdges: [],
			modifiedEdges: [],
			nameChanged: false,
			parentChanged: false,
			descriptionChanged: false,
			tagsChanged: false,
		});
	});

	it('detects added + removed nodes', () => {
		const before = makeWorkflow({ nodes: [baseStart, { id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } }] });
		const after = makeWorkflow({ nodes: [baseStart, { id: 'b', type: 'notification', position: { x: 0, y: 0 }, data: {} }] });
		const d = diffWorkflows(before, after);
		expect(d.addedNodes).toEqual(['b']);
		expect(d.removedNodes).toEqual(['a']);
	});

	it('detects modified nodes via deep equality', () => {
		const before = makeWorkflow({
			nodes: [baseStart, { id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-1' } }],
		});
		const after = makeWorkflow({
			nodes: [baseStart, { id: 'a', type: 'request', position: { x: 10, y: 10 }, data: { requestId: 'req-1' } }],
		});
		expect(diffWorkflows(before, after).modifiedNodes).toEqual(['a']);
	});

	it('ignores key-order differences in node data', () => {
		const before = makeWorkflow({
			nodes: [baseStart, { id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-1', overrides: { headers: { h1: { value: ['x'] } } } } as never }],
		});
		const after = makeWorkflow({
			nodes: [baseStart, { id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { overrides: { headers: { h1: { value: ['x'] } } }, requestId: 'req-1' } as never }],
		});
		expect(diffWorkflows(before, after).modifiedNodes).toEqual([]);
	});

	it('reports name + parent changes', () => {
		const before = makeWorkflow();
		const after = makeWorkflow({ name: 'renamed', parent: 'folder-123' });
		const d = diffWorkflows(before, after);
		expect(d.nameChanged).toBe(true);
		expect(d.parentChanged).toBe(true);
	});

	it('reports description + tag changes', () => {
		const before = makeWorkflow({ description: 'old', tags: ['a'] });
		const after = makeWorkflow({ description: 'new', tags: ['a', 'b'] });
		const d = diffWorkflows(before, after);
		expect(d.descriptionChanged).toBe(true);
		expect(d.tagsChanged).toBe(true);
	});

	it('treats undefined-vs-empty as no change for description/tags', () => {
		const before = makeWorkflow();
		const after = makeWorkflow({ description: '', tags: [] });
		const d = diffWorkflows(before, after);
		expect(d.descriptionChanged).toBe(false);
		expect(d.tagsChanged).toBe(false);
	});

	it('detects added + removed + modified edges', () => {
		const before = makeWorkflow({
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 's', target: 'b' },
			],
		});
		const after = makeWorkflow({
			edges: [
				{ id: 'e1', source: 's', target: 'a', label: 'happy' },
				{ id: 'e3', source: 's', target: 'c' },
			],
		});
		const d = diffWorkflows(before, after);
		expect(d.modifiedEdges).toEqual(['e1']);
		expect(d.removedEdges).toEqual(['e2']);
		expect(d.addedEdges).toEqual(['e3']);
	});
});

describe('summariseChange', () => {
	it('returns null for a no-op diff', () => {
		const wf = makeWorkflow();
		expect(summariseChange(diffWorkflows(wf, wf))).toBeNull();
	});

	it('reports added/removed/modified counts in singular/plural form', () => {
		const before = makeWorkflow({
			nodes: [baseStart, { id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } }],
			edges: [{ id: 'e1', source: 's', target: 'a' }],
		});
		const after = makeWorkflow({
			nodes: [
				baseStart,
				{ id: 'a', type: 'request', position: { x: 1, y: 1 }, data: { requestId: 'req-1' } },
				{ id: 'b', type: 'notification', position: { x: 0, y: 0 }, data: {} },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a', label: 'happy' },
				{ id: 'e2', source: 'a', target: 'b' },
			],
		});
		const summary = summariseChange(diffWorkflows(before, after));
		expect(summary).toContain('+1 step');
		expect(summary).toContain('~1 step');
		expect(summary).toContain('+1 edge');
		expect(summary).toContain('~1 edge');
	});

	it('reports metadata-only changes (rename, move, description, tags)', () => {
		const before = makeWorkflow();
		const after = makeWorkflow({ name: 'X', parent: 'folder-1', description: 'd', tags: ['t'] });
		const summary = summariseChange(diffWorkflows(before, after));
		expect(summary).toContain('renamed');
		expect(summary).toContain('moved');
		expect(summary).toContain('description');
		expect(summary).toContain('tags');
	});
});
