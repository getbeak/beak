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
