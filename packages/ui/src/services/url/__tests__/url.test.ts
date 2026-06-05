import type { PathParameter } from '@getbeak/types/request';
import type { Context, ValueSections } from '@getbeak/types/values';
import { describe, expect, it, vi } from 'vitest';

import { analyseUrlEdit, substitutePathParameters } from '..';

vi.mock('../../../features/variables/parser', () => ({
	// Stub parseValueSections to its trivial implementation: concatenate
	// string literals, render non-string parts as their `type` placeholder.
	// Real-world parsing involves the variable handler registry — out of
	// scope for these URL-shape tests.
	parseValueSections: async (_context: Context, parts: ValueSections) =>
		parts.map(p => (typeof p === 'string' ? p : `\${${p.type}}`)).join(''),
}));

function makeContext(): Context {
	return {
		selectedSets: {},
		variableSets: {},
		flightHistory: {},
		projectTree: {},
		currentRequestId: 'req-1',
	};
}

function pp(name: string, value: ValueSections, opts: Partial<PathParameter> = {}): PathParameter {
	return { name, value, ...opts };
}

describe('url/substitutePathParameters', () => {
	it('passes parts through unchanged when no path-parameters declared', () => {
		const parts: ValueSections = ['/users/:id'];
		expect(substitutePathParameters(parts, undefined)).toBe(parts);
		expect(substitutePathParameters(parts, {})).toBe(parts);
	});

	it('splices a bound path parameter into the URL', () => {
		const result = substitutePathParameters(['/users/:id/posts'], { id: pp('id', ['42']) });
		expect(result).toEqual(['/users/', '42', '/posts']);
	});

	it('keeps the literal `:name` for unbound parameters', () => {
		const result = substitutePathParameters(['/users/:id'], {});
		// {} is a no-op fast path
		expect(result).toEqual(['/users/:id']);

		const withDeclared = substitutePathParameters(['/users/:id'], { id: pp('id', []) });
		expect(withDeclared).toEqual(['/users/', ':id']);
	});

	it('preserves variable-reference parts in the bound value', () => {
		const result = substitutePathParameters(['/users/:id'], {
			id: pp('id', [{ type: 'variable_set_item', payload: { itemId: 'abc' } }]),
		});
		expect(result).toEqual(['/users/', { type: 'variable_set_item', payload: { itemId: 'abc' } }]);
	});

	it('handles multiple path-params in one URL', () => {
		const result = substitutePathParameters(['/users/:userId/posts/:postId'], {
			userId: pp('userId', ['42']),
			postId: pp('postId', ['99']),
		});
		expect(result).toEqual(['/users/', '42', '/posts/', '99']);
	});
});

describe('url/analyseUrlEdit', () => {
	it('returns unchanged parts when the URL has no `?` tail', async () => {
		const parts: ValueSections = ['https://example.com/users'];
		const result = await analyseUrlEdit(parts, makeContext());
		expect(result).toEqual({
			sanitisedParts: parts,
			extractedQuery: [],
			queryDetected: false,
		});
	});

	it('extracts a single query parameter and trims the URL', async () => {
		const result = await analyseUrlEdit(['https://example.com/users?id=42'], makeContext());
		expect(result.queryDetected).toBe(true);
		expect(result.extractedQuery).toEqual([{ name: 'id', value: '42' }]);
		expect(result.sanitisedParts).toEqual(['https://example.com/users']);
	});

	it('extracts multiple query params', async () => {
		const result = await analyseUrlEdit(['https://example.com/users?a=1&b=2'], makeContext());
		expect(result.queryDetected).toBe(true);
		expect(result.extractedQuery).toEqual([
			{ name: 'a', value: '1' },
			{ name: 'b', value: '2' },
		]);
		expect(result.sanitisedParts).toEqual(['https://example.com/users']);
	});

	it('preserves variable parts before the `?` boundary', async () => {
		const parts: ValueSections = ['https://', { type: 'variable_set_item', payload: { itemId: 'host' } }, '/users?id=42'];
		const result = await analyseUrlEdit(parts, makeContext());
		expect(result.queryDetected).toBe(true);
		expect(result.extractedQuery).toEqual([{ name: 'id', value: '42' }]);
		expect(result.sanitisedParts).toEqual([
			'https://',
			{ type: 'variable_set_item', payload: { itemId: 'host' } },
			'/users',
		]);
	});
});
