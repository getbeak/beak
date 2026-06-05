import type { FolderNode, RequestNode, Tree } from '@getbeak/types/nodes';
import { beforeEach, describe, expect, it } from 'vitest';

import { consumeAddEvent, consumeRemoveEvent, registerFolderRename, registerRequestRename } from '../pending-renames';

function drain() {
	// Each test runs in isolation against a shared module-level Set;
	// drain it by consuming every plausible path so a leak in one test
	// can't infect the next.
	for (let i = 0; i < 64; i++) {
		consumeAddEvent(`__drain__/${i}`);
		consumeRemoveEvent(`__drain__/${i}`);
	}
}

beforeEach(drain);

function makeRequest(id: string, filePath: string): RequestNode {
	return {
		type: 'request',
		filePath,
		parent: filePath.slice(0, filePath.lastIndexOf('/')),
		name: filePath.slice(filePath.lastIndexOf('/') + 1),
		id,
		mode: 'failed',
		error: { type: 'unknown_error' as never },
	};
}

function makeFolder(filePath: string): FolderNode {
	return {
		type: 'folder',
		id: filePath,
		filePath,
		name: filePath.slice(filePath.lastIndexOf('/') + 1),
		parent: filePath.slice(0, filePath.lastIndexOf('/')),
	};
}

describe('pending-renames (request rename)', () => {
	it('consumes the matching remove + add then stops', () => {
		registerRequestRename('/p/tree/foo.json', '/p/tree/bar.json');

		expect(consumeRemoveEvent('/p/tree/foo.json')).toBe(true);
		expect(consumeAddEvent('/p/tree/bar.json')).toBe(true);

		// Already consumed — a real subsequent event at the same path
		// should fall through to the regular handler.
		expect(consumeRemoveEvent('/p/tree/foo.json')).toBe(false);
		expect(consumeAddEvent('/p/tree/bar.json')).toBe(false);
	});

	it('does not swallow unrelated events', () => {
		registerRequestRename('/p/tree/foo.json', '/p/tree/bar.json');

		expect(consumeRemoveEvent('/p/tree/other.json')).toBe(false);
		expect(consumeAddEvent('/p/tree/other.json')).toBe(false);
	});
});

describe('pending-renames (folder rename)', () => {
	function seedTree(): Tree {
		const tree: Tree = {} as Tree;
		const folder = makeFolder('/p/tree/foo');
		const child = makeRequest('r1', '/p/tree/foo/a.json');
		const nestedFolder = makeFolder('/p/tree/foo/sub');
		const nestedChild = makeRequest('r2', '/p/tree/foo/sub/b.json');
		tree[folder.filePath] = folder;
		tree[child.id] = child;
		tree[nestedFolder.filePath] = nestedFolder;
		tree[nestedChild.id] = nestedChild;
		return tree;
	}

	it('consumes events for every descendant under old and new paths', () => {
		registerFolderRename(seedTree(), '/p/tree/foo', '/p/tree/baz');

		// Folder itself + each child path at both old and new locations.
		expect(consumeRemoveEvent('/p/tree/foo')).toBe(true);
		expect(consumeRemoveEvent('/p/tree/foo/a.json')).toBe(true);
		expect(consumeRemoveEvent('/p/tree/foo/sub')).toBe(true);
		expect(consumeRemoveEvent('/p/tree/foo/sub/b.json')).toBe(true);

		expect(consumeAddEvent('/p/tree/baz')).toBe(true);
		expect(consumeAddEvent('/p/tree/baz/a.json')).toBe(true);
		expect(consumeAddEvent('/p/tree/baz/sub')).toBe(true);
		expect(consumeAddEvent('/p/tree/baz/sub/b.json')).toBe(true);
	});

	it('suppresses prefix-matched events (e.g. _collection.json that is not in tree)', () => {
		registerFolderRename(seedTree(), '/p/tree/foo', '/p/tree/baz');

		// _collection.json is not in the tree but lives under the folder;
		// the prefix match keeps the watcher's collection events from
		// firing a spurious refresh during the rename window.
		expect(consumeRemoveEvent('/p/tree/foo/_collection.json')).toBe(true);
		expect(consumeAddEvent('/p/tree/baz/_collection.json')).toBe(true);
	});

	it('leaves events outside the renamed folder alone', () => {
		registerFolderRename(seedTree(), '/p/tree/foo', '/p/tree/baz');

		expect(consumeRemoveEvent('/p/tree/other/a.json')).toBe(false);
		expect(consumeAddEvent('/p/tree/foobar/a.json')).toBe(false); // foobar != foo prefix
	});
});
