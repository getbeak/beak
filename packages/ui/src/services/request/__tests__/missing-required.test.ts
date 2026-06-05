import type { ValidRequestNode } from '@getbeak/types/nodes';
import { describe, expect, it } from 'vitest';

import { summarizeMissingRequired } from '../missing-required';

function makeNode(info: Partial<ValidRequestNode['info']>): ValidRequestNode {
	return {
		id: 'r-1',
		type: 'request',
		mode: 'valid',
		name: 'r',
		filePath: 'tree/r.json',
		parent: 'tree',
		info: {
			verb: 'get',
			url: [''],
			query: {},
			headers: {},
			body: { type: 'text', payload: '' },
			options: { followRedirects: false },
			...info,
		},
	};
}

describe('summarizeMissingRequired', () => {
	it('returns zero counts for a bare request', () => {
		const result = summarizeMissingRequired(makeNode({}));
		expect(result).toEqual({
			count: 0,
			scopes: [],
			perScope: { headers: 0, query: 0, body: 0 },
		});
	});

	it('counts a required-empty header', () => {
		const result = summarizeMissingRequired(
			makeNode({
				headers: {
					h: { name: 'Authorization', value: [''], enabled: true, required: true },
				},
			}),
		);
		expect(result.perScope.headers).toBe(1);
		expect(result.count).toBe(1);
		expect(result.scopes).toEqual(['Headers']);
	});

	it('does NOT count disabled rows even when required', () => {
		const result = summarizeMissingRequired(
			makeNode({
				headers: {
					h: { name: 'Authorization', value: [''], enabled: false, required: true },
				},
			}),
		);
		expect(result.count).toBe(0);
	});

	it('does NOT count non-empty rows', () => {
		const result = summarizeMissingRequired(
			makeNode({
				headers: {
					h: { name: 'Authorization', value: ['Bearer x'], enabled: true, required: true },
				},
			}),
		);
		expect(result.count).toBe(0);
	});

	it('counts required-empty url_encoded_form rows on the body scope', () => {
		const result = summarizeMissingRequired(
			makeNode({
				body: {
					type: 'url_encoded_form',
					payload: {
						a: { name: 'a', value: [''], enabled: true, required: true },
					},
				},
			}),
		);
		expect(result.perScope.body).toBe(1);
		expect(result.scopes).toEqual(['Body']);
	});

	it('counts required-empty entries in a graphql variables payload', () => {
		const result = summarizeMissingRequired(
			makeNode({
				body: {
					type: 'graphql',
					payload: {
						query: '',
						variables: {
							v: { id: 'v', parentId: 'root', enabled: true, type: 'string', value: [''], required: true },
						},
					},
				},
			}),
		);
		expect(result.perScope.body).toBe(1);
	});

	it('aggregates across scopes', () => {
		const result = summarizeMissingRequired(
			makeNode({
				headers: { h: { name: 'h', value: [''], enabled: true, required: true } },
				query: { q: { name: 'q', value: [''], enabled: true, required: true } },
				body: {
					type: 'url_encoded_form',
					payload: { b: { name: 'b', value: [''], enabled: true, required: true } },
				},
			}),
		);
		expect(result.count).toBe(3);
		expect(result.scopes).toEqual(['Headers', 'Params', 'Body']);
		expect(result.perScope).toEqual({ headers: 1, query: 1, body: 1 });
	});
});
