import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadCollectionAtFolder, loadCollectionForRequest, loadNearestCollection } from '../collection';

vi.mock('../../ipc', () => ({
	ipcFsService: {
		pathExists: vi.fn(),
		readJson: vi.fn(),
	},
}));

// Resolved at module-load time after the mock is installed.
const { ipcFsService } = await import('../../ipc');
const pathExists = ipcFsService.pathExists as ReturnType<typeof vi.fn>;
const readJson = ipcFsService.readJson as ReturnType<typeof vi.fn>;

describe('loadCollectionAtFolder', () => {
	beforeEach(() => {
		pathExists.mockReset();
		readJson.mockReset();
	});
	afterEach(() => {
		pathExists.mockReset();
		readJson.mockReset();
	});

	it('returns null when no collection file exists', async () => {
		pathExists.mockResolvedValueOnce(false);
		const result = await loadCollectionAtFolder('tree/users');
		expect(result).toBeNull();
		expect(readJson).not.toHaveBeenCalled();
	});

	it('returns the parsed collection when valid', async () => {
		pathExists.mockResolvedValueOnce(true);
		readJson.mockResolvedValueOnce({ source: { type: 'manual' } });
		const result = await loadCollectionAtFolder('tree/users');
		expect(result?.source.type).toBe('manual');
	});

	it('returns null for a malformed collection (does not throw)', async () => {
		pathExists.mockResolvedValueOnce(true);
		readJson.mockResolvedValueOnce({ source: { type: 'soap' } });
		const result = await loadCollectionAtFolder('tree/users');
		expect(result).toBeNull();
	});

	it('returns null if readJson rejects (corrupt JSON)', async () => {
		pathExists.mockResolvedValueOnce(true);
		readJson.mockRejectedValueOnce(new Error('bad json'));
		const result = await loadCollectionAtFolder('tree/users');
		expect(result).toBeNull();
	});
});

describe('loadNearestCollection', () => {
	beforeEach(() => {
		pathExists.mockReset();
		readJson.mockReset();
	});

	it('finds a collection at the starting folder', async () => {
		pathExists.mockResolvedValueOnce(true);
		readJson.mockResolvedValueOnce({ source: { type: 'manual' } });
		const r = await loadNearestCollection('tree/users');
		expect(r?.source.type).toBe('manual');
	});

	it('walks up the tree directory chain until a collection is found', async () => {
		// tree/users/sub → no, tree/users → no, tree → yes
		pathExists
			.mockResolvedValueOnce(false) // tree/users/sub
			.mockResolvedValueOnce(false) // tree/users
			.mockResolvedValueOnce(true); // tree
		readJson.mockResolvedValueOnce({
			source: { type: 'openapi', specPath: 'spec.yaml' },
			defaults: { baseUrl: ['https://api.example.com'] },
		});
		const r = await loadNearestCollection('tree/users/sub');
		expect(r?.source.type).toBe('openapi');
		expect(r?.defaults?.baseUrl).toEqual(['https://api.example.com']);
	});

	it('stops at the project root (does not look outside tree/)', async () => {
		// Starting from a path with no `tree` segment — should bail immediately.
		const r = await loadNearestCollection('outside/of/project');
		expect(r).toBeNull();
		expect(pathExists).toHaveBeenCalledTimes(1);
	});
});

describe('loadCollectionForRequest', () => {
	beforeEach(() => {
		pathExists.mockReset();
		readJson.mockReset();
	});

	it('delegates to loadNearestCollection on the request directory', async () => {
		pathExists.mockResolvedValueOnce(true);
		readJson.mockResolvedValueOnce({ source: { type: 'manual' } });
		const r = await loadCollectionForRequest('tree/users/list.json');
		expect(r?.source.type).toBe('manual');
	});
});
