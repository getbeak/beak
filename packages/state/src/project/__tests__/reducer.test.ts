import type { FolderNode, ValidRequestNode } from '@getbeak/types/nodes';
import { createReducer } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import {
	buildProjectTreeReducer,
	initialProjectTreeState,
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	projectOpened,
	removeNodeFromStore,
	removeNodeFromStoreByPath,
	renameNodeInTree,
	startProject,
} from '..';

const reducer = createReducer(initialProjectTreeState, builder => {
	buildProjectTreeReducer(builder);
});

function makeRequestNode(overrides: Partial<ValidRequestNode> = {}): ValidRequestNode {
	return {
		id: 'req-1',
		type: 'request',
		mode: 'valid',
		name: 'X',
		filePath: '/tree/req-1.json',
		parent: null,
		info: {
			verb: 'GET',
			url: [''],
			query: {},
			headers: {},
			body: { type: 'text', payload: '' },
			options: { followRedirects: true },
		},
		...overrides,
	};
}

function makeFolderNode(overrides: Partial<FolderNode> = {}): FolderNode {
	return {
		id: 'folder-1',
		type: 'folder',
		name: 'F',
		filePath: '/tree/F',
		parent: null,
		...overrides,
	};
}

const empty = reducer(undefined, { type: '@@INIT' });

describe('project tree reducer (core)', () => {
	it('starts with an empty tree, unloaded, in `none` mode', () => {
		expect(empty).toEqual({ loaded: false, mode: 'none', tree: {} });
	});

	it('startProject marks unloaded', () => {
		const next = reducer({ ...empty, loaded: true }, startProject());
		expect(next.loaded).toBe(false);
	});

	it('insertProjectInfo stores id, name and mode', () => {
		const next = reducer(empty, insertProjectInfo({ id: 'p1', name: 'Demo', mode: 'disk' }));
		expect(next.id).toBe('p1');
		expect(next.name).toBe('Demo');
		expect(next.mode).toBe('disk');
	});

	it('projectOpened replaces tree and marks loaded', () => {
		const node = makeRequestNode();
		const next = reducer(empty, projectOpened({ tree: { [node.id]: node } }));
		expect(next.loaded).toBe(true);
		expect(next.tree[node.id]).toEqual(node);
	});

	it('insertRequestNode adds the node keyed by id', () => {
		const next = reducer(empty, insertRequestNode(makeRequestNode({ id: 'r2' })));
		expect(next.tree.r2).toBeDefined();
	});

	it('insertFolderNode adds the folder keyed by filePath', () => {
		const next = reducer(empty, insertFolderNode(makeFolderNode({ filePath: '/tree/F' })));
		expect(next.tree['/tree/F']).toBeDefined();
	});

	it('removeNodeFromStore deletes by id', () => {
		const seeded = reducer(empty, insertRequestNode(makeRequestNode({ id: 'r2' })));
		const next = reducer(seeded, removeNodeFromStore('r2'));
		expect(next.tree.r2).toBeUndefined();
	});

	it('removeNodeFromStoreByPath deletes by filePath', () => {
		const seeded = reducer(empty, insertRequestNode(makeRequestNode({ id: 'r2', filePath: '/tree/r2.json' })));
		const next = reducer(seeded, removeNodeFromStoreByPath('/tree/r2.json'));
		expect(next.tree.r2).toBeUndefined();
	});

	it('removeNodeFromStoreByPath is a no-op when the path is unknown', () => {
		const seeded = reducer(empty, insertRequestNode(makeRequestNode({ id: 'r2', filePath: '/tree/r2.json' })));
		const next = reducer(seeded, removeNodeFromStoreByPath('/missing.json'));
		expect(next.tree.r2).toBeDefined();
	});
});

describe('project tree reducer (renameNodeInTree — folder rename rewrites descendants)', () => {
	function seedFolderTree() {
		// /tree/foo
		//   /tree/foo/req-a   (request, key=req-a)
		//   /tree/foo/bar     (folder, key=/tree/foo/bar)
		//     /tree/foo/bar/req-b   (request, key=req-b)
		let s = empty;
		s = reducer(s, insertFolderNode(makeFolderNode({ id: '/tree/foo', name: 'foo', filePath: '/tree/foo', parent: '/tree' })));
		s = reducer(s, insertFolderNode(makeFolderNode({ id: '/tree/foo/bar', name: 'bar', filePath: '/tree/foo/bar', parent: '/tree/foo' })));
		s = reducer(s, insertRequestNode(makeRequestNode({ id: 'req-a', name: 'a', filePath: '/tree/foo/a.json', parent: '/tree/foo' })));
		s = reducer(s, insertRequestNode(makeRequestNode({ id: 'req-b', name: 'b', filePath: '/tree/foo/bar/b.json', parent: '/tree/foo/bar' })));
		return s;
	}

	it('re-keys the folder under its new path and renames it', () => {
		const next = reducer(seedFolderTree(), renameNodeInTree({ nodeId: '/tree/foo', name: 'baz' }));
		expect(next.tree['/tree/foo']).toBeUndefined();
		expect(next.tree['/tree/baz']).toBeDefined();
		expect(next.tree['/tree/baz']?.name).toBe('baz');
		expect(next.tree['/tree/baz']?.filePath).toBe('/tree/baz');
		expect((next.tree['/tree/baz'] as FolderNode).id).toBe('/tree/baz');
	});

	it('re-keys descendant folders and updates their filePath + parent', () => {
		const next = reducer(seedFolderTree(), renameNodeInTree({ nodeId: '/tree/foo', name: 'baz' }));
		expect(next.tree['/tree/foo/bar']).toBeUndefined();
		const subFolder = next.tree['/tree/baz/bar'];
		expect(subFolder).toBeDefined();
		expect(subFolder?.filePath).toBe('/tree/baz/bar');
		expect(subFolder?.parent).toBe('/tree/baz');
	});

	it('rewrites descendant request paths and parents but keeps the ksuid key', () => {
		const next = reducer(seedFolderTree(), renameNodeInTree({ nodeId: '/tree/foo', name: 'baz' }));
		const reqA = next.tree['req-a'];
		const reqB = next.tree['req-b'];
		expect(reqA?.filePath).toBe('/tree/baz/a.json');
		expect(reqA?.parent).toBe('/tree/baz');
		expect(reqB?.filePath).toBe('/tree/baz/bar/b.json');
		expect(reqB?.parent).toBe('/tree/baz/bar');
	});

	it('renaming a request node only changes its name', () => {
		const seeded = reducer(empty, insertRequestNode(makeRequestNode({ id: 'r2', name: 'old', filePath: '/tree/old.json' })));
		const next = reducer(seeded, renameNodeInTree({ nodeId: 'r2', name: 'new' }));
		expect(next.tree.r2?.name).toBe('new');
		expect(next.tree.r2?.filePath).toBe('/tree/old.json');
	});

	it('is a no-op when the new name resolves to the same path', () => {
		const seeded = seedFolderTree();
		const next = reducer(seeded, renameNodeInTree({ nodeId: '/tree/foo', name: 'foo' }));
		expect(next.tree).toEqual(seeded.tree);
	});

	it('is a no-op when the node is not in the tree', () => {
		const next = reducer(seedFolderTree(), renameNodeInTree({ nodeId: '/tree/missing', name: 'x' }));
		expect(next.tree['/tree/foo']).toBeDefined();
	});
});
