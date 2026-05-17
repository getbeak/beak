import { describe, expect, it } from 'vitest';

import { walkWorkflow } from '../simulator';
import type { WorkflowFile } from '../types';

const baseStart = { id: 's', type: 'start' as const, position: { x: 0, y: 0 }, data: {} };

describe('walkWorkflow', () => {
	it('aborts cleanly when there is no Start node', () => {
		const wf: WorkflowFile = { id: 'wf', name: 'no start', nodes: [], edges: [] };
		const events = walkWorkflow(wf);
		expect(events).toEqual([{ type: 'workflow-aborted', workflowId: 'wf', reason: 'no Start node' }]);
	});

	it('walks Start → request → notification linearly', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'linear',
			nodes: [
				baseStart,
				{ id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
				{ id: 'n1', type: 'notification', position: { x: 0, y: 0 }, data: {} },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'r1' },
				{ id: 'e2', source: 'r1', target: 'n1' },
			],
		};
		const events = walkWorkflow(wf);
		const kinds = events.map(e => e.type);
		expect(kinds[0]).toBe('workflow-start');
		expect(kinds.at(-1)).toBe('workflow-complete');
		expect(events.some(e => e.type === 'enter-node' && e.nodeId === 'r1')).toBe(true);
		expect(events.some(e => e.type === 'enter-node' && e.nodeId === 'n1')).toBe(true);
	});

	it('emits request-skipped when the request node is unlinked', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'unlinked',
			nodes: [baseStart, { id: 'r1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: null } }],
			edges: [{ id: 'e1', source: 's', target: 'r1' }],
		};
		const events = walkWorkflow(wf);
		expect(events.some(e => e.type === 'request-skipped' && e.nodeId === 'r1')).toBe(true);
	});

	it('takes the loop body N times then the after branch', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'loop',
			nodes: [
				baseStart,
				{ id: 'l1', type: 'loop', position: { x: 0, y: 0 }, data: { mode: 'count', count: 3 } },
				{ id: 'b1', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
				{ id: 'a1', type: 'notification', position: { x: 0, y: 0 }, data: {} },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'l1' },
				{ id: 'e2', source: 'l1', target: 'b1', sourceHandle: 'body' },
				{ id: 'e3', source: 'l1', target: 'a1', sourceHandle: 'after' },
			],
		};
		const events = walkWorkflow(wf);
		const iterations = events.filter(e => e.type === 'loop-iteration' && e.nodeId === 'l1');
		expect(iterations).toHaveLength(3);
		// The body request runs once per iteration → 3 enter-node{r=b1}.
		const bodyEntries = events.filter(e => e.type === 'enter-node' && e.nodeId === 'b1');
		expect(bodyEntries).toHaveLength(3);
		// After branch runs exactly once at the end.
		const afterEntries = events.filter(e => e.type === 'enter-node' && e.nodeId === 'a1');
		expect(afterEntries).toHaveLength(1);
	});

	it('routes condition true/false via the resolver', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'condition',
			nodes: [
				baseStart,
				{ id: 'c1', type: 'condition', position: { x: 0, y: 0 }, data: { operator: 'truthy' } },
				{ id: 'okPath', type: 'notification', position: { x: 0, y: 0 }, data: {} },
				{ id: 'noPath', type: 'notification', position: { x: 0, y: 0 }, data: {} },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'c1' },
				{ id: 'e2', source: 'c1', target: 'okPath', sourceHandle: 'true' },
				{ id: 'e3', source: 'c1', target: 'noPath', sourceHandle: 'false' },
			],
		};
		const truthy = walkWorkflow(wf, { evaluateCondition: () => true });
		expect(truthy.some(e => e.type === 'enter-node' && e.nodeId === 'okPath')).toBe(true);
		expect(truthy.some(e => e.type === 'enter-node' && e.nodeId === 'noPath')).toBe(false);

		const falsy = walkWorkflow(wf, { evaluateCondition: () => false });
		expect(falsy.some(e => e.type === 'enter-node' && e.nodeId === 'okPath')).toBe(false);
		expect(falsy.some(e => e.type === 'enter-node' && e.nodeId === 'noPath')).toBe(true);
	});

	it('respects maxSteps to break out of accidental cycles', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'cycle',
			nodes: [
				baseStart,
				{ id: 'a', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
				{ id: 'b', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-b' } },
			],
			edges: [
				{ id: 'e1', source: 's', target: 'a' },
				{ id: 'e2', source: 'a', target: 'b' },
				{ id: 'e3', source: 'b', target: 'a' },
			],
		};
		const events = walkWorkflow(wf, { maxSteps: 10 });
		expect(events.at(-1)).toEqual({ type: 'workflow-aborted', workflowId: 'wf', reason: 'max steps exceeded' });
	});

	it('skips comments cleanly', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'comments',
			nodes: [baseStart, { id: 'cm', type: 'comment', position: { x: 0, y: 0 }, data: { text: 'note' } }],
			edges: [],
		};
		// Comments are unreachable from Start (no edge), so they shouldn't be
		// walked. Workflow completes cleanly.
		const events = walkWorkflow(wf);
		expect(events.some(e => e.type === 'comment-skipped')).toBe(false);
		expect(events.at(-1)?.type).toBe('workflow-complete');
	});

	it('falls back to bare outbound when a labelled handle is missing', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'condition-fallback',
			nodes: [
				baseStart,
				{ id: 'c1', type: 'condition', position: { x: 0, y: 0 }, data: { operator: 'truthy' } },
				{ id: 'fallback', type: 'notification', position: { x: 0, y: 0 }, data: {} },
			],
			// Only an unlabelled edge — the simulator should still take it.
			edges: [
				{ id: 'e1', source: 's', target: 'c1' },
				{ id: 'e2', source: 'c1', target: 'fallback' },
			],
		};
		const events = walkWorkflow(wf, { evaluateCondition: () => true });
		expect(events.some(e => e.type === 'enter-node' && e.nodeId === 'fallback')).toBe(true);
	});
});
