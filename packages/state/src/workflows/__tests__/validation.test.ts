import { describe, expect, it } from 'vitest';

import type { WorkflowFile, WorkflowNode } from '../types';
import { validateNode, validateWorkflow } from '../validation';

describe('validateNode', () => {
	it('flags a loop with count = 0', () => {
		const warnings = validateNode({
			id: 'l',
			type: 'loop',
			position: { x: 0, y: 0 },
			data: { mode: 'count', count: 0 },
		} as WorkflowNode);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].kind).toBe('loop-zero-count');
	});

	it('does not flag a forEach loop (count is irrelevant)', () => {
		const warnings = validateNode({
			id: 'l',
			type: 'loop',
			position: { x: 0, y: 0 },
			data: { mode: 'forEach' },
		} as WorkflowNode);
		expect(warnings).toEqual([]);
	});

	it('flags a notification with no title or body', () => {
		const warnings = validateNode({
			id: 'n',
			type: 'notification',
			position: { x: 0, y: 0 },
			data: {},
		} as WorkflowNode);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].kind).toBe('notification-empty');
	});

	it('does not flag a notification with at least a title or body', () => {
		const warnings = validateNode({
			id: 'n',
			type: 'notification',
			position: { x: 0, y: 0 },
			data: { title: ['hi'] },
		} as WorkflowNode);
		expect(warnings).toEqual([]);
	});

	it('flags a condition with equals/contains/not_equals but no right side', () => {
		for (const op of ['equals', 'not_equals', 'contains']) {
			const warnings = validateNode({
				id: 'c',
				type: 'condition',
				position: { x: 0, y: 0 },
				data: { operator: op },
			} as WorkflowNode);
			expect(warnings.map(w => w.kind)).toEqual(['condition-missing-right']);
		}
	});

	it('does not flag truthy/falsy operators (they ignore right)', () => {
		for (const op of ['truthy', 'falsy']) {
			const warnings = validateNode({
				id: 'c',
				type: 'condition',
				position: { x: 0, y: 0 },
				data: { operator: op },
			} as WorkflowNode);
			expect(warnings).toEqual([]);
		}
	});

	it('flags an empty comment', () => {
		const warnings = validateNode({
			id: 'cm',
			type: 'comment',
			position: { x: 0, y: 0 },
			data: { text: '   ' },
		} as WorkflowNode);
		expect(warnings.map(w => w.kind)).toEqual(['comment-empty']);
	});

	it('returns empty for nodes without per-kind warnings (start, request)', () => {
		expect(validateNode({ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} })).toEqual([]);
		expect(
			validateNode({
				id: 'r',
				type: 'request',
				position: { x: 0, y: 0 },
				data: { requestId: 'req-a' },
			} as WorkflowNode),
		).toEqual([]);
	});
});

describe('validateWorkflow', () => {
	it('skips nodes with no warnings', () => {
		const wf: WorkflowFile = {
			id: 'wf',
			name: 'mixed',
			nodes: [
				{ id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
				{ id: 'r', type: 'request', position: { x: 0, y: 0 }, data: { requestId: 'req-a' } },
				{ id: 'l', type: 'loop', position: { x: 0, y: 0 }, data: { mode: 'count', count: 0 } } as WorkflowNode,
				{ id: 'n', type: 'notification', position: { x: 0, y: 0 }, data: { title: ['hi'] } } as WorkflowNode,
			],
			edges: [],
		};
		const result = validateWorkflow(wf);
		expect([...result.keys()]).toEqual(['l']);
	});
});
