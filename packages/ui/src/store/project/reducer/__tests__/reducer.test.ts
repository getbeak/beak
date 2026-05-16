import type { FolderNode, ValidRequestNode } from '@getbeak/types/nodes';
import { describe, expect, it } from 'vitest';

import {
	alertClear,
	alertInsert,
	alertRemove,
	alertRemoveDependents,
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	projectOpened,
	removeNodeFromStore,
	removeNodeFromStoreByPath,
	renameCancelled,
	renameStarted,
	renameUpdated,
	requestBodyAssetChanged,
	requestBodyFileChanged,
	requestBodyTextChanged,
	requestBodyTypeChanged,
	requestHeaderAdded,
	requestHeaderRemoved,
	requestHeaderUpdated,
	requestOptionFollowRedirects,
	requestQueryAdded,
	requestQueryUpdated,
	requestUriUpdated,
	setLatestWrite,
	setWriteDebounce,
	startProject,
} from '../../actions';
import { initialState } from '../../types';
import projectReducer from '..';

function makeRequestNode(overrides: Partial<ValidRequestNode> = {}): ValidRequestNode {
	return {
		id: 'req-1',
		type: 'request',
		mode: 'valid',
		name: 'My request',
		filePath: '/tree/req-1.json',
		parent: null,
		info: {
			verb: 'GET',
			url: ['https://example.com'],
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
		name: 'My folder',
		filePath: '/tree/My folder',
		parent: null,
		...overrides,
	};
}

const empty = projectReducer(undefined, { type: '@@INIT' });

describe('project reducer — lifecycle', () => {
	it('startProject marks unloaded', () => {
		const next = projectReducer({ ...initialState, loaded: true }, startProject());
		expect(next.loaded).toBe(false);
	});

	it('insertProjectInfo stores id, name and mode', () => {
		const next = projectReducer(empty, insertProjectInfo({ id: 'p1', name: 'Demo', mode: 'disk' }));
		expect(next.id).toBe('p1');
		expect(next.name).toBe('Demo');
		expect(next.mode).toBe('disk');
	});

	it('projectOpened sets tree and marks loaded', () => {
		const node = makeRequestNode();
		const next = projectReducer(empty, projectOpened({ tree: { [node.id]: node } }));
		expect(next.loaded).toBe(true);
		expect(next.tree[node.id]).toEqual(node);
	});

	it('setLatestWrite stores the write metadata', () => {
		const next = projectReducer(empty, setLatestWrite({ filePath: '/a', writtenAt: 100 }));
		expect(next.latestWrite).toEqual({ filePath: '/a', writtenAt: 100 });
	});

	it('setWriteDebounce records a nonce per request', () => {
		const next = projectReducer(empty, setWriteDebounce({ requestId: 'r1', nonce: 'n1' }));
		expect(next.writeDebouncer.r1).toBe('n1');
	});
});

describe('project reducer — request fields', () => {
	const seed = projectReducer(empty, insertRequestNode(makeRequestNode()));

	it('requestUriUpdated updates verb and url', () => {
		const next = projectReducer(
			seed,
			requestUriUpdated({
				requestId: 'req-1',
				verb: 'POST',
				url: ['https://other.com'],
			}),
		);
		const node = next.tree['req-1'] as ValidRequestNode;
		expect(node.info.verb).toBe('POST');
		expect(node.info.url).toEqual(['https://other.com']);
	});

	it('requestQueryAdded creates a new query entry', () => {
		const next = projectReducer(
			seed,
			requestQueryAdded({
				requestId: 'req-1',
				name: 'q',
				value: ['1'],
			}),
		);
		const node = next.tree['req-1'] as ValidRequestNode;
		const entries = Object.values(node.info.query);
		expect(entries).toHaveLength(1);
		expect(entries[0]).toMatchObject({ name: 'q', value: ['1'], enabled: true });
	});

	it('requestHeaderAdded then requestHeaderUpdated and remove cycle through entry', () => {
		const added = projectReducer(
			seed,
			requestHeaderAdded({
				requestId: 'req-1',
				name: 'X-Test',
				value: ['1'],
			}),
		);
		const id = Object.keys((added.tree['req-1'] as ValidRequestNode).info.headers)[0];

		const updated = projectReducer(
			added,
			requestHeaderUpdated({
				requestId: 'req-1',
				identifier: id,
				name: 'X-Test-2',
				enabled: false,
			}),
		);
		expect((updated.tree['req-1'] as ValidRequestNode).info.headers[id]).toMatchObject({
			name: 'X-Test-2',
			enabled: false,
		});

		const removed = projectReducer(
			updated,
			requestHeaderRemoved({
				requestId: 'req-1',
				identifier: id,
			}),
		);
		expect((removed.tree['req-1'] as ValidRequestNode).info.headers[id]).toBeUndefined();
	});

	it('requestQueryUpdated mutates an existing entry', () => {
		const added = projectReducer(
			seed,
			requestQueryAdded({
				requestId: 'req-1',
				name: 'q',
				value: ['1'],
			}),
		);
		const id = Object.keys((added.tree['req-1'] as ValidRequestNode).info.query)[0];
		const updated = projectReducer(
			added,
			requestQueryUpdated({
				requestId: 'req-1',
				identifier: id,
				name: 'q2',
			}),
		);
		expect((updated.tree['req-1'] as ValidRequestNode).info.query[id]?.name).toBe('q2');
	});

	it('requestOptionFollowRedirects toggles the option', () => {
		const next = projectReducer(
			seed,
			requestOptionFollowRedirects({
				requestId: 'req-1',
				followRedirects: false,
			}),
		);
		const node = next.tree['req-1'] as ValidRequestNode;
		expect(node.info.options.followRedirects).toBe(false);
	});
});

describe('project reducer — tree', () => {
	it('insertRequestNode adds the node under its id', () => {
		const node = makeRequestNode({ id: 'r2' });
		const next = projectReducer(empty, insertRequestNode(node));
		expect(next.tree.r2).toEqual(node);
	});

	it('insertFolderNode adds the folder under its filePath', () => {
		const folder = makeFolderNode({ id: 'f1', filePath: '/tree/f1' });
		const next = projectReducer(empty, insertFolderNode(folder));
		expect(next.tree['/tree/f1']).toEqual(folder);
	});

	it('removeNodeFromStore deletes the node', () => {
		const seeded = projectReducer(empty, insertRequestNode(makeRequestNode({ id: 'r2' })));
		const next = projectReducer(seeded, removeNodeFromStore('r2'));
		expect(next.tree.r2).toBeUndefined();
	});

	it('removeNodeFromStoreByPath finds and deletes by filePath', () => {
		const node = makeRequestNode({ id: 'r2', filePath: '/tree/r2.json' });
		const seeded = projectReducer(empty, insertRequestNode(node));
		const next = projectReducer(seeded, removeNodeFromStoreByPath('/tree/r2.json'));
		expect(next.tree.r2).toBeUndefined();
	});

	it('rename lifecycle: started → updated → cancelled clears activeRename', () => {
		const seeded = projectReducer(empty, insertRequestNode(makeRequestNode()));
		const started = projectReducer(seeded, renameStarted({ requestId: 'req-1' }));
		expect(started.activeRename).toEqual({ id: 'req-1', name: 'My request' });

		const updated = projectReducer(started, renameUpdated({ requestId: 'req-1', name: 'New name' }));
		expect(updated.activeRename?.name).toBe('New name');

		const cancelled = projectReducer(updated, renameCancelled({ requestId: 'req-1' }));
		expect(cancelled.activeRename).toBeUndefined();
	});
});

describe('project reducer — body', () => {
	const seed = projectReducer(empty, insertRequestNode(makeRequestNode()));

	it('requestBodyTypeChanged switches body type and payload', () => {
		const next = projectReducer(
			seed,
			requestBodyTypeChanged({
				requestId: 'req-1',
				type: 'text',
				payload: 'hi',
			}),
		);
		const node = next.tree['req-1'] as ValidRequestNode;
		expect(node.info.body.type).toBe('text');
		expect(node.info.body.payload).toBe('hi');
	});

	it('requestBodyTextChanged updates the text payload', () => {
		const next = projectReducer(
			seed,
			requestBodyTextChanged({
				requestId: 'req-1',
				text: 'updated',
			}),
		);
		const node = next.tree['req-1'] as ValidRequestNode;
		expect(node.info.body.payload).toBe('updated');
	});

	it('requestBodyAssetChanged switches to file type and writes an assetRef', () => {
		const next = projectReducer(
			seed,
			requestBodyAssetChanged({
				requestId: 'req-1',
				assetRef: {
					sha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
					size: 42,
					contentType: 'image/png',
				},
			}),
		);
		const node = next.tree['req-1'] as ValidRequestNode;
		expect(node.info.body.type).toBe('file');
		expect((node.info.body.payload as { assetRef?: { sha256: string } }).assetRef?.sha256)
			.toBe('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
	});

	it('requestBodyAssetChanged with undefined clears the ref while keeping legacy fields', () => {
		// First put a fileReferenceId on, then attach an asset, then clear it.
		const withLegacy = projectReducer(
			seed,
			requestBodyFileChanged({
				requestId: 'req-1',
				fileReferenceId: 'legacy-ref',
				contentType: 'image/png',
			}),
		);
		const withAsset = projectReducer(
			withLegacy,
			requestBodyAssetChanged({
				requestId: 'req-1',
				assetRef: { sha256: 'f'.repeat(64), size: 1 },
			}),
		);
		const cleared = projectReducer(
			withAsset,
			requestBodyAssetChanged({ requestId: 'req-1', assetRef: undefined }),
		);
		const payload = (cleared.tree['req-1'] as ValidRequestNode).info.body.payload as {
			fileReferenceId?: string;
			assetRef?: unknown;
		};
		expect(payload.fileReferenceId).toBe('legacy-ref');
		expect(payload.assetRef).toBeUndefined();
	});
});

describe('project reducer — alerts', () => {
	it('alertInsert and alertRemove round-trip', () => {
		const next = projectReducer(
			empty,
			alertInsert({
				ident: 'a1',
				alert: { type: 'missing_encryption' },
			}),
		);
		expect(next.alerts.a1).toEqual({ type: 'missing_encryption' });

		const removed = projectReducer(next, alertRemove('a1'));
		expect(removed.alerts.a1).toBeUndefined();
	});

	it('alertRemoveDependents clears alerts for a requestId', () => {
		const seeded = projectReducer(
			empty,
			alertInsert({
				ident: 'a1',
				alert: {
					type: 'http_body_not_allowed',
					dependencies: { requestId: 'req-1' },
				},
			}),
		);
		const next = projectReducer(seeded, alertRemoveDependents({ requestId: 'req-1' }));
		expect(next.alerts.a1).toBeUndefined();
	});

	it('alertClear wipes everything', () => {
		const seeded = projectReducer(
			empty,
			alertInsert({
				ident: 'a1',
				alert: { type: 'missing_encryption' },
			}),
		);
		const next = projectReducer(seeded, alertClear());
		expect(next.alerts).toEqual({});
	});
});
