import { describe, expect, it } from 'vitest';

import { insertKeyAfter, reorderRecord, uniqueName } from '../helpers';

// ---------------------------------------------------------------------------
// reorderRecord
// ---------------------------------------------------------------------------

describe('reorderRecord', () => {
	it('moves a key to a lower index', () => {
		const rec = { a: 1, b: 2, c: 3 };
		const result = reorderRecord(rec, 'c', 0);
		expect(Object.keys(result)).toEqual(['c', 'a', 'b']);
		expect(Object.values(result)).toEqual([3, 1, 2]);
	});

	it('moves a key to a higher index', () => {
		const rec = { a: 1, b: 2, c: 3 };
		const result = reorderRecord(rec, 'a', 2);
		expect(Object.keys(result)).toEqual(['b', 'c', 'a']);
	});

	it('returns the original record unchanged when key is not found', () => {
		const rec = { a: 1, b: 2 };
		const result = reorderRecord(rec, 'z', 0);
		expect(result).toBe(rec);
	});

	it('returns the original record unchanged when from === toIndex', () => {
		const rec = { a: 1, b: 2, c: 3 };
		const result = reorderRecord(rec, 'b', 1);
		expect(result).toBe(rec);
	});

	it('clamps toIndex to the last position when it exceeds the length', () => {
		const rec = { a: 1, b: 2, c: 3 };
		const result = reorderRecord(rec, 'a', 999);
		expect(Object.keys(result)).toEqual(['b', 'c', 'a']);
	});

	it('clamps toIndex to 0 when negative', () => {
		const rec = { a: 1, b: 2, c: 3 };
		const result = reorderRecord(rec, 'c', -5);
		expect(Object.keys(result)).toEqual(['c', 'a', 'b']);
	});
});

// ---------------------------------------------------------------------------
// insertKeyAfter
// ---------------------------------------------------------------------------

describe('insertKeyAfter', () => {
	it('inserts the new key immediately after afterKey', () => {
		const rec = { a: 'x', b: 'y', c: 'z' };
		const result = insertKeyAfter(rec, 'a', 'new', 'val');
		expect(Object.keys(result)).toEqual(['a', 'new', 'b', 'c']);
		expect(result['new']).toBe('val');
	});

	it('appends the new key when afterKey is not found', () => {
		const rec = { a: 'x', b: 'y' };
		const result = insertKeyAfter(rec, 'missing', 'new', 'val');
		expect(Object.keys(result)).toEqual(['a', 'b', 'new']);
	});

	it('inserts after the last key correctly', () => {
		const rec = { a: 'x', b: 'y' };
		const result = insertKeyAfter(rec, 'b', 'new', 'val');
		expect(Object.keys(result)).toEqual(['a', 'b', 'new']);
	});

	it('preserves all existing values', () => {
		const rec = { a: 1, b: 2, c: 3 };
		const result = insertKeyAfter(rec, 'b', 'x', 99);
		expect(result['a']).toBe(1);
		expect(result['b']).toBe(2);
		expect(result['c']).toBe(3);
		expect(result['x']).toBe(99);
	});

	it('works on an empty record (afterKey not found → append)', () => {
		const rec: Record<string, string> = {};
		const result = insertKeyAfter(rec, 'anything', 'first', 'v');
		expect(Object.keys(result)).toEqual(['first']);
	});
});

// ---------------------------------------------------------------------------
// uniqueName
// ---------------------------------------------------------------------------

describe('uniqueName', () => {
	it('returns the base name when it is not taken', () => {
		expect(uniqueName('foo', ['bar', 'baz'], 0)).toBe('foo');
	});

	it('appends " 2" when the base name is taken', () => {
		expect(uniqueName('foo', ['foo'], 0)).toBe('foo 2');
	});

	it('increments past already-taken suffixed names', () => {
		expect(uniqueName('foo', ['foo', 'foo 2', 'foo 3'], 0)).toBe('foo 4');
	});

	it('falls back to base + now when all numeric suffixes up to 999 are taken', () => {
		const taken = ['foo'];
		for (let i = 2; i < 1000; i++) taken.push(`foo ${i}`);
		expect(uniqueName('foo', taken, 9999)).toBe('foo 9999');
	});

	it('returns the base name when taken list is empty', () => {
		expect(uniqueName('myName', [], 0)).toBe('myName');
	});
});
