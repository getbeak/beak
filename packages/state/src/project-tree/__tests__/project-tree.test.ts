import type { FolderNode, Tree, ValidRequestNode } from '@getbeak/types/nodes';
import { describe, expect, it } from 'vitest';

import { filterByType, findChildren, findDescendants, findFolderByPath, getParentChain } from '..';

function folder(id: string, parent: string | null, filePath: string): FolderNode {
	return { id, type: 'folder', name: id, filePath, parent };
}

function request(id: string, parent: string | null, filePath: string): ValidRequestNode {
	return {
		id,
		type: 'request',
		mode: 'valid',
		name: id,
		filePath,
		parent,
		info: {
			verb: 'get',
			url: [''],
			query: {},
			headers: {},
			body: { type: 'text', payload: '' },
			options: { followRedirects: false },
		},
	};
}

// Minimal tree:
//   tree/users       (folder f-users)
//     get-user       (request r-get)
//     create-user    (request r-create)
//     tree/users/admin  (folder f-admin)
//       delete-admin (request r-del)
//   tree/posts       (folder f-posts)
function makeTree(): Tree {
	const tree: Tree = {};
	tree['f-users'] = folder('f-users', null, 'tree/users');
	tree['r-get'] = request('r-get', 'f-users', 'tree/users/get-user.json');
	tree['r-create'] = request('r-create', 'f-users', 'tree/users/create-user.json');
	tree['f-admin'] = folder('f-admin', 'f-users', 'tree/users/admin');
	tree['r-del'] = request('r-del', 'f-admin', 'tree/users/admin/delete-admin.json');
	tree['f-posts'] = folder('f-posts', null, 'tree/posts');
	return tree;
}

describe('project-tree/findFolderByPath', () => {
	it('finds an existing folder by path', () => {
		const tree = makeTree();
		expect(findFolderByPath(tree, 'tree/users')?.id).toBe('f-users');
		expect(findFolderByPath(tree, 'tree/users/admin')?.id).toBe('f-admin');
	});

	it('returns undefined for unknown path', () => {
		const tree = makeTree();
		expect(findFolderByPath(tree, 'tree/missing')).toBeUndefined();
	});

	it('does not match request nodes even if filePath coincides', () => {
		const tree = makeTree();
		expect(findFolderByPath(tree, 'tree/users/get-user.json')).toBeUndefined();
	});
});

describe('project-tree/findChildren', () => {
	it('returns every direct child', () => {
		const tree = makeTree();
		const ids = findChildren(tree, 'f-users')
			.map(n => n.id)
			.sort();
		expect(ids).toEqual(['f-admin', 'r-create', 'r-get']);
	});

	it('narrows by type', () => {
		const tree = makeTree();
		const folders = findChildren(tree, 'f-users', 'folder');
		expect(folders.map(n => n.id)).toEqual(['f-admin']);
		const requests = findChildren(tree, 'f-users', 'request')
			.map(n => n.id)
			.sort();
		expect(requests).toEqual(['r-create', 'r-get']);
	});

	it('returns empty for leaves', () => {
		const tree = makeTree();
		expect(findChildren(tree, 'r-get')).toEqual([]);
	});
});

describe('project-tree/findDescendants', () => {
	it('returns every descendant (depth-first, root not included)', () => {
		const tree = makeTree();
		const ids = findDescendants(tree, 'f-users').map(n => n.id);
		expect(ids).toContain('r-get');
		expect(ids).toContain('r-create');
		expect(ids).toContain('f-admin');
		expect(ids).toContain('r-del');
		expect(ids).not.toContain('f-users');
		expect(ids).not.toContain('f-posts');
		expect(ids.length).toBe(4);
	});

	it('narrows by type while walking through unmatched parents', () => {
		const tree = makeTree();
		const requestIds = findDescendants(tree, 'f-users', 'request')
			.map(n => n.id)
			.sort();
		// Descends into f-admin and picks up r-del even though f-admin is filtered out
		expect(requestIds).toEqual(['r-create', 'r-del', 'r-get']);
	});

	it('returns empty for an unknown root', () => {
		const tree = makeTree();
		expect(findDescendants(tree, 'nope')).toEqual([]);
	});
});

describe('project-tree/getParentChain', () => {
	it('walks up to the root', () => {
		const tree = makeTree();
		expect(getParentChain(tree, 'r-del').map(n => n.id)).toEqual(['f-admin', 'f-users']);
	});

	it('returns empty for a top-level node', () => {
		const tree = makeTree();
		expect(getParentChain(tree, 'f-users')).toEqual([]);
	});

	it('returns empty for an unknown id', () => {
		const tree = makeTree();
		expect(getParentChain(tree, 'nope')).toEqual([]);
	});

	it('does not loop on a malformed cycle', () => {
		const cyclic: Tree = {
			a: folder('a', 'b', 'tree/a'),
			b: folder('b', 'a', 'tree/b'),
		};
		// Walks once around the cycle then breaks — what matters is
		// terminating, not which node we stop at. The result has to be
		// finite for the test to pass at all.
		const result = getParentChain(cyclic, 'a');
		expect(result.length).toBeLessThan(10);
		expect(new Set(result.map(n => n.id))).toEqual(new Set(['a', 'b']));
	});
});

describe('project-tree/filterByType', () => {
	it('returns every folder', () => {
		const tree = makeTree();
		const ids = filterByType(tree, 'folder')
			.map(n => n.id)
			.sort();
		expect(ids).toEqual(['f-admin', 'f-posts', 'f-users']);
	});

	it('returns every request', () => {
		const tree = makeTree();
		const ids = filterByType(tree, 'request')
			.map(n => n.id)
			.sort();
		expect(ids).toEqual(['r-create', 'r-del', 'r-get']);
	});
});
