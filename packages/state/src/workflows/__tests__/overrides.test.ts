import { describe, expect, it } from 'vitest';

import { mergeJson, mergeKv, pruneBody, pruneOverrideMap, pruneOverrides } from '../overrides';

describe('mergeKv', () => {
	it('passes the linked record through unchanged when no overrides', () => {
		const linked = { h1: { name: 'A', value: ['1'], enabled: true } };
		expect(mergeKv(linked, undefined)).toBe(linked);
	});

	it('overlays value + enabled on the matching id', () => {
		const result = mergeKv(
			{
				h1: { name: 'A', value: ['1'], enabled: true, required: true },
				h2: { name: 'B', value: ['2'], enabled: true },
			},
			{ h1: { value: ['9'], enabled: false } },
		);
		expect(result.h1).toEqual({ name: 'A', value: ['9'], enabled: false, required: true });
		expect(result.h2).toEqual({ name: 'B', value: ['2'], enabled: true });
	});

	it('skips override slots that set neither value nor enabled', () => {
		const result = mergeKv({ h1: { name: 'A', value: ['1'], enabled: true } }, { h1: {} });
		expect(result.h1).toEqual({ name: 'A', value: ['1'], enabled: true });
	});
});

describe('mergeJson', () => {
	it('overlays a string entry value', () => {
		const result = mergeJson(
			{
				root: { id: 'root', parentId: null, enabled: true, type: 'object' },
				e1: { id: 'e1', parentId: 'root', enabled: true, type: 'string', value: ['base'] },
			},
			{ e1: { value: ['override'] } },
		);
		expect((result.e1 as { value: string[] }).value).toEqual(['override']);
	});

	it('flips a boolean entrys enabled bit', () => {
		const result = mergeJson(
			{ e1: { id: 'e1', parentId: 'root', enabled: true, type: 'boolean', value: true } as never },
			{ e1: { enabled: false } },
		);
		expect(result.e1.enabled).toBe(false);
		expect((result.e1 as { value: boolean }).value).toBe(true);
	});
});

describe('pruneOverrideMap', () => {
	it('returns undefined when every slot is empty', () => {
		expect(pruneOverrideMap({ a: {}, b: {} })).toBeUndefined();
	});

	it('keeps slots that touch value or enabled', () => {
		const result = pruneOverrideMap({ a: { value: ['x'] }, b: {}, c: { enabled: false } });
		expect(result).toEqual({ a: { value: ['x'] }, c: { enabled: false } });
	});
});

describe('pruneBody', () => {
	it('returns undefined when both halves are empty', () => {
		expect(pruneBody({})).toBeUndefined();
		expect(pruneBody({ fields: {}, raw: undefined })).toBeUndefined();
		expect(pruneBody({ fields: {}, raw: { contentType: undefined, text: undefined } })).toBeUndefined();
	});

	it('keeps fields when populated', () => {
		const result = pruneBody({ fields: { a: { value: ['x'] } } });
		expect(result).toEqual({ fields: { a: { value: ['x'] } } });
	});

	it('keeps raw when it has a contentType or non-empty text', () => {
		expect(pruneBody({ raw: { contentType: 'application/json' } })).toEqual({ raw: { contentType: 'application/json' } });
		expect(pruneBody({ raw: { text: ['hi'] } })).toEqual({ raw: { text: ['hi'] } });
	});
});

describe('pruneOverrides', () => {
	it('returns undefined when the user has touched nothing', () => {
		expect(pruneOverrides({})).toBeUndefined();
		expect(pruneOverrides({ headers: {}, query: {}, fragment: [] })).toBeUndefined();
	});

	it('preserves non-empty containers', () => {
		const result = pruneOverrides({
			headers: { h: { value: ['x'] } },
			query: {},
			fragment: ['frag1'],
		});
		expect(result).toEqual({ headers: { h: { value: ['x'] } }, fragment: ['frag1'] });
	});
});
