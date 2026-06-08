import type { FolderNode, ValidRequestNode } from '@getbeak/types/nodes';
import { describe, expect, it } from 'vitest';

import {
	initialProjectTreeState,
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	moveNodeInTree,
	projectOpened,
	projectReducer,
	removeNodeFromStore,
	removeNodeFromStoreByPath,
	renameNodeInTree,
	startProject,
} from '..';

const reducer = projectReducer;

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
		expect(empty).toEqual(initialProjectTreeState);
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
		s = reducer(
			s,
			insertFolderNode(makeFolderNode({ id: '/tree/foo', name: 'foo', filePath: '/tree/foo', parent: '/tree' })),
		);
		s = reducer(
			s,
			insertFolderNode(
				makeFolderNode({ id: '/tree/foo/bar', name: 'bar', filePath: '/tree/foo/bar', parent: '/tree/foo' }),
			),
		);
		s = reducer(
			s,
			insertRequestNode(makeRequestNode({ id: 'req-a', name: 'a', filePath: '/tree/foo/a.json', parent: '/tree/foo' })),
		);
		s = reducer(
			s,
			insertRequestNode(
				makeRequestNode({ id: 'req-b', name: 'b', filePath: '/tree/foo/bar/b.json', parent: '/tree/foo/bar' }),
			),
		);
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

	it('renaming a request node updates its name and re-derives the filePath', () => {
		const seeded = reducer(
			empty,
			insertRequestNode(makeRequestNode({ id: 'r2', name: 'old', filePath: '/tree/old.json' })),
		);
		const next = reducer(seeded, renameNodeInTree({ nodeId: 'r2', name: 'new' }));
		expect(next.tree.r2?.name).toBe('new');
		// filePath rewrite is what lets the disk-mode rename effect
		// optimistically update the tree before the fs-watcher catches up,
		// keeping the open tab mounted instead of flashing closed/open.
		expect(next.tree.r2?.filePath).toBe('/tree/new.json');
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

describe('project tree reducer (moveNodeInTree — memory move)', () => {
	function seedTwoFolders() {
		// /tree/foo and /tree/bar both at root.
		// /tree/foo has one request and one subfolder with a request.
		let s = empty;
		s = reducer(
			s,
			insertFolderNode(makeFolderNode({ id: '/tree/foo', name: 'foo', filePath: '/tree/foo', parent: '/tree' })),
		);
		s = reducer(
			s,
			insertFolderNode(makeFolderNode({ id: '/tree/bar', name: 'bar', filePath: '/tree/bar', parent: '/tree' })),
		);
		s = reducer(
			s,
			insertFolderNode(
				makeFolderNode({ id: '/tree/foo/sub', name: 'sub', filePath: '/tree/foo/sub', parent: '/tree/foo' }),
			),
		);
		s = reducer(
			s,
			insertRequestNode(makeRequestNode({ id: 'req-a', name: 'a', filePath: '/tree/foo/a.json', parent: '/tree/foo' })),
		);
		s = reducer(
			s,
			insertRequestNode(
				makeRequestNode({ id: 'req-b', name: 'b', filePath: '/tree/foo/sub/b.json', parent: '/tree/foo/sub' }),
			),
		);
		return s;
	}

	it('moves a request into a sibling folder by rewriting filePath + parent', () => {
		const next = reducer(seedTwoFolders(), moveNodeInTree({ nodeId: 'req-a', destinationFolderPath: '/tree/bar' }));
		expect(next.tree['req-a']?.filePath).toBe('/tree/bar/a.json');
		expect(next.tree['req-a']?.parent).toBe('/tree/bar');
	});

	it('moves a folder into a sibling and re-keys it under the new path', () => {
		const next = reducer(seedTwoFolders(), moveNodeInTree({ nodeId: '/tree/foo', destinationFolderPath: '/tree/bar' }));
		expect(next.tree['/tree/foo']).toBeUndefined();
		expect(next.tree['/tree/bar/foo']).toBeDefined();
		expect(next.tree['/tree/bar/foo']?.parent).toBe('/tree/bar');
		expect(next.tree['/tree/bar/foo']?.filePath).toBe('/tree/bar/foo');
	});

	it('moving a folder rewrites descendants under the new path', () => {
		const next = reducer(seedTwoFolders(), moveNodeInTree({ nodeId: '/tree/foo', destinationFolderPath: '/tree/bar' }));
		// Sub-folder re-keyed
		expect(next.tree['/tree/foo/sub']).toBeUndefined();
		expect(next.tree['/tree/bar/foo/sub']?.parent).toBe('/tree/bar/foo');
		// Requests stay keyed by ksuid
		expect(next.tree['req-a']?.filePath).toBe('/tree/bar/foo/a.json');
		expect(next.tree['req-a']?.parent).toBe('/tree/bar/foo');
		expect(next.tree['req-b']?.filePath).toBe('/tree/bar/foo/sub/b.json');
		expect(next.tree['req-b']?.parent).toBe('/tree/bar/foo/sub');
	});

	it('moves a request to root (tree)', () => {
		const next = reducer(seedTwoFolders(), moveNodeInTree({ nodeId: 'req-a', destinationFolderPath: '/tree' }));
		expect(next.tree['req-a']?.filePath).toBe('/tree/a.json');
		expect(next.tree['req-a']?.parent).toBe('/tree');
	});

	it('is a no-op when the destination matches the current parent (same path)', () => {
		const seeded = seedTwoFolders();
		const next = reducer(seeded, moveNodeInTree({ nodeId: 'req-a', destinationFolderPath: '/tree/foo' }));
		expect(next.tree).toEqual(seeded.tree);
	});

	it('is a no-op when the node is not in the tree', () => {
		const next = reducer(seedTwoFolders(), moveNodeInTree({ nodeId: 'missing', destinationFolderPath: '/tree/bar' }));
		expect(next.tree['/tree/foo']).toBeDefined();
	});
});
