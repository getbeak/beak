import type { EntryMap } from '@getbeak/types/body-editor-json';
import { describe, expect, it } from 'vitest';

import { countWhere, findChildren, findRoot, findRootIncludingDisabled, isEntryValueEmpty, walkEnabled } from '..';

const isEmpty = (parts: unknown): boolean => {
	if (!Array.isArray(parts) || parts.length === 0) return true;
	return parts.every(p => typeof p === 'string' && p.length === 0);
};

function makeTree(): EntryMap {
	return {
		root: { id: 'root', parentId: null, enabled: true, type: 'object' },
		'r-name': { id: 'r-name', parentId: 'root', enabled: true, type: 'string', value: ['Alex'], name: 'name' },
		'r-age': { id: 'r-age', parentId: 'root', enabled: true, type: 'number', value: ['30'], name: 'age', required: true },
		'r-off': {
			id: 'r-off',
			parentId: 'root',
			enabled: false,
			type: 'string',
			value: ['hidden'],
			name: 'hidden',
		},
		'r-blank': {
			id: 'r-blank',
			parentId: 'root',
			enabled: true,
			type: 'string',
			value: [''],
			name: 'blank',
			required: true,
		},
	};
}

describe('entry-map/findRoot', () => {
	it('returns the enabled root', () => {
		const tree = makeTree();
		expect(findRoot(tree)?.id).toBe('root');
	});

	it('returns undefined when the root is disabled — matches convertToRealJson semantics', () => {
		const tree = makeTree();
		tree['root'] = { ...tree['root'], enabled: false };
		expect(findRoot(tree)).toBeUndefined();
	});

	it('returns undefined when there is no root', () => {
		expect(findRoot({})).toBeUndefined();
	});
});

describe('entry-map/findRootIncludingDisabled', () => {
	it('returns the structural root even when disabled', () => {
		const tree = makeTree();
		tree['root'] = { ...tree['root'], enabled: false };
		expect(findRootIncludingDisabled(tree)?.id).toBe('root');
	});
});

describe('entry-map/findChildren', () => {
	it('returns enabled children by default', () => {
		const tree = makeTree();
		const ids = findChildren(tree, 'root')
			.map(c => c.id)
			.sort();
		expect(ids).toEqual(['r-age', 'r-blank', 'r-name']);
	});

	it('includes disabled children when asked', () => {
		const tree = makeTree();
		const ids = findChildren(tree, 'root', { includeDisabled: true })
			.map(c => c.id)
			.sort();
		expect(ids).toEqual(['r-age', 'r-blank', 'r-name', 'r-off']);
	});
});

describe('entry-map/walkEnabled', () => {
	it('visits only enabled entries', () => {
		const tree = makeTree();
		const seen: string[] = [];
		walkEnabled(tree, e => seen.push(e.id));
		expect(seen.sort()).toEqual(['r-age', 'r-blank', 'r-name', 'root']);
	});
});

describe('entry-map/countWhere', () => {
	it('counts required-but-empty entries with isEntryValueEmpty as predicate', () => {
		const tree = makeTree();
		const count = countWhere(tree, e => e.required === true && e.enabled !== false && isEntryValueEmpty(e, isEmpty));
		expect(count).toBe(1); // r-blank
	});
});

describe('entry-map/isEntryValueEmpty', () => {
	it('treats containers as non-empty regardless of contents', () => {
		expect(isEntryValueEmpty({ id: '1', parentId: null, enabled: true, type: 'object' }, isEmpty)).toBe(false);
		expect(isEntryValueEmpty({ id: '1', parentId: null, enabled: true, type: 'array' }, isEmpty)).toBe(false);
	});

	it('treats intrinsics as non-empty', () => {
		expect(isEntryValueEmpty({ id: '1', parentId: null, enabled: true, type: 'boolean', value: false }, isEmpty)).toBe(
			false,
		);
		expect(isEntryValueEmpty({ id: '1', parentId: null, enabled: true, type: 'null', value: null }, isEmpty)).toBe(false);
	});

	it('delegates the string/number/enum check to the value-parts predicate', () => {
		expect(isEntryValueEmpty({ id: '1', parentId: null, enabled: true, type: 'string', value: [''] }, isEmpty)).toBe(
			true,
		);
		expect(isEntryValueEmpty({ id: '1', parentId: null, enabled: true, type: 'number', value: ['42'] }, isEmpty)).toBe(
			false,
		);
	});

	it('treats undefined as empty', () => {
		expect(isEntryValueEmpty(undefined, isEmpty)).toBe(true);
	});
});
