import { describe, expect, it } from 'vitest';

import { diffWorkflows } from '../diff';
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
