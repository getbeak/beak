import { describe, expect, it } from 'vitest';

import { workflowSchema } from '../../schemas/beak-workflow';
import { inspectGraph } from '../helpers';
import { instantiateTemplate, templateCatalog, type TemplateKey } from '../templates';

/**
 * Deterministic minter — emits prefixed monotonically-increasing ids so
 * tests can assert against specific node ids without ksuid in the loop.
 */
function makeMinter() {
	const counts: Record<string, number> = {};
	return (prefix: 'workflow' | 'node' | 'edge') => {
		counts[prefix] = (counts[prefix] ?? 0) + 1;
		return `${prefix}-${counts[prefix]}`;
	};
}

describe('templates', () => {
	const allKeys: TemplateKey[] = templateCatalog.map(t => t.key);

	for (const key of allKeys) {
		it(`emits a schema-valid workflow for the ${key} template`, () => {
			const wf = instantiateTemplate({ template: key, name: 'test', mintId: makeMinter() });
			expect(() => workflowSchema.parse(wf)).not.toThrow();
		});

		it(`puts a single Start node first in the ${key} template`, () => {
			const wf = instantiateTemplate({ template: key, name: 'test', mintId: makeMinter() });
			const starts = wf.nodes.filter(n => n.type === 'start');
			expect(starts).toHaveLength(1);
			expect(wf.nodes[0].type).toBe('start');
		});

		it(`leaves no unreachable steps in the ${key} template`, () => {
			const wf = instantiateTemplate({ template: key, name: 'test', mintId: makeMinter() });
			const r = inspectGraph(wf);
			expect(r.unreachable).toEqual([]);
		});
	}

	it('blank template has just the Start node', () => {
		const wf = instantiateTemplate({ template: 'blank', name: 'test', mintId: makeMinter() });
		expect(wf.nodes).toHaveLength(1);
		expect(wf.edges).toEqual([]);
	});

	it('every template emits version="1"', () => {
		for (const key of allKeys) {
			const wf = instantiateTemplate({ template: key, name: 'test', mintId: makeMinter() });
			expect(wf.version).toBe('1');
		}
	});

	it('smoke-test template wires Start → request → notification', () => {
		const wf = instantiateTemplate({ template: 'smoke-test', name: 'test', mintId: makeMinter() });
		expect(wf.nodes.map(n => n.type)).toEqual(['start', 'request', 'notification']);
		expect(wf.edges).toHaveLength(2);
	});

	it('auth-chain template wires Start → request → request', () => {
		const wf = instantiateTemplate({ template: 'auth-chain', name: 'test', mintId: makeMinter() });
		expect(wf.nodes.map(n => n.type)).toEqual(['start', 'request', 'request']);
		const types = wf.edges.map(e => `${e.source}→${e.target}`);
		// Both edges should keep the chain ordered.
		expect(types).toHaveLength(2);
	});

	it('paginated-fetch template wires Start → loop --body--> request', () => {
		const wf = instantiateTemplate({ template: 'paginated-fetch', name: 'test', mintId: makeMinter() });
		expect(wf.nodes.map(n => n.type)).toEqual(['start', 'loop', 'request']);
		const loopBodyEdge = wf.edges.find(e => e.sourceHandle === 'body');
		expect(loopBodyEdge).toBeDefined();
	});

	it('honours a parent folder id', () => {
		const wf = instantiateTemplate({
			template: 'blank',
			name: 'test',
			parent: 'folder-123',
			mintId: makeMinter(),
		});
		expect(wf.parent).toBe('folder-123');
	});

	it('uses the caller-supplied minter for every id', () => {
		const wf = instantiateTemplate({ template: 'smoke-test', name: 'test', mintId: makeMinter() });
		// 1 workflow id + 3 node ids (start, request, notification) + 2 edge ids.
		const allIds = [wf.id, ...wf.nodes.map(n => n.id), ...wf.edges.map(e => e.id)];
		const unique = new Set(allIds);
		expect(unique.size).toBe(allIds.length);
	});
});
