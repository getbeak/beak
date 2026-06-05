import { describe, expect, it } from 'vitest';

import { flatten, isEmpty, substitute, walk } from '..';

describe('value-parts/isEmpty', () => {
	it('treats undefined as empty', () => {
		expect(isEmpty(undefined)).toBe(true);
	});

	it('treats [] as empty', () => {
		expect(isEmpty([])).toBe(true);
	});

	it('treats [""] as empty', () => {
		expect(isEmpty([''])).toBe(true);
	});

	it('treats ["", "", ""] as empty', () => {
		expect(isEmpty(['', '', ''])).toBe(true);
	});

	it('treats ["x"] as non-empty', () => {
		expect(isEmpty(['x'])).toBe(false);
	});

	it('treats a single variable-reference part as non-empty (even if it might resolve to empty)', () => {
		expect(isEmpty([{ type: 'variable_set_item', payload: { itemId: 'abc' } }])).toBe(false);
	});

	it('treats ["", variable, ""] as non-empty because of the variable', () => {
		expect(isEmpty(['', { type: 'env', payload: {} }, ''])).toBe(false);
	});
});

describe('value-parts/flatten', () => {
	it('joins literal strings', () => {
		expect(flatten(['hello ', 'world'])).toBe('hello world');
	});

	it('uses default `?` placeholder for variable parts', () => {
		expect(flatten(['x=', { type: 'env', payload: {} }, '!'])).toBe('x=?!');
	});

	it('uses caller-provided placeholder', () => {
		expect(flatten(['x=', { type: 'env', payload: {} }], p => `<${p.type}>`)).toBe('x=<env>');
	});
});

describe('value-parts/walk', () => {
	it('visits each part with its index', () => {
		const parts = ['a', { type: 'env', payload: {} }, 'b'];
		const seen: Array<[unknown, number]> = [];
		walk(parts, (p, i) => seen.push([p, i]));
		expect(seen).toEqual([
			['a', 0],
			[parts[1], 1],
			['b', 2],
		]);
	});
});

describe('value-parts/substitute', () => {
	it('passes non-string parts through untouched', () => {
		const v = { type: 'env', payload: {} };
		const result = substitute([v, 'hello'], /world/, () => ['x']);
		expect(result).toEqual([v, 'hello']);
	});

	it('substitutes a matched token with replacement parts', () => {
		const result = substitute(['/users/:id/posts'], /:([a-z]+)/, () => [{ type: 'env', payload: { name: 'id' } }]);
		expect(result).toEqual(['/users/', { type: 'env', payload: { name: 'id' } }, '/posts']);
	});

	it('keeps the literal match when replace returns null', () => {
		const result = substitute(['/users/:id'], /:([a-z]+)/, () => null);
		expect(result).toEqual(['/users/', ':id']);
	});

	it('handles multiple matches in one string', () => {
		const result = substitute(['/a/:x/b/:y'], /:([a-z]+)/, match => [{ type: 'env', payload: { name: match[1] } }]);
		expect(result).toEqual([
			'/a/',
			{ type: 'env', payload: { name: 'x' } },
			'/b/',
			{ type: 'env', payload: { name: 'y' } },
		]);
	});

	it('forces the regex global even when caller forgot the g flag', () => {
		const result = substitute(['ax bx cx'], /([a-c])x/, m => [m[1]!.toUpperCase()]);
		expect(result).toEqual(['A', ' ', 'B', ' ', 'C']);
	});

	it('preserves the trailing string when the last match is not at the end', () => {
		const result = substitute(['/users/:id/tail'], /:([a-z]+)/, () => ['REPLACED']);
		expect(result).toEqual(['/users/', 'REPLACED', '/tail']);
	});

	it('preserves the leading string when the first match is not at the start', () => {
		const result = substitute(['head/:id'], /:([a-z]+)/, () => ['REPLACED']);
		expect(result).toEqual(['head/', 'REPLACED']);
	});
});
