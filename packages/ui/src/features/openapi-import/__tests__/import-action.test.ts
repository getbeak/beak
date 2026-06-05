import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@beak/ui/lib/ipc', () => ({
	ipcOpenApiService: {
		syncFromSpec: vi.fn(),
	},
}));

const { ipcOpenApiService } = await import('@beak/ui/lib/ipc');
const { importOpenApi } = await import('../import-action');

const syncFromSpec = ipcOpenApiService.syncFromSpec as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
	syncFromSpec.mockReset();
});

const VALID_SPEC_JSON = JSON.stringify({
	openapi: '3.0.0',
	info: { title: 'x', version: '1' },
	servers: [{ url: 'https://api.example.com' }],
	paths: {},
});

describe('importOpenApi', () => {
	it('parses, validates, and forwards to the IPC service', async () => {
		syncFromSpec.mockResolvedValueOnce({
			collectionPath: '/x/_collection.json',
			requestPaths: ['/x/list.json'],
			overwritten: [],
			skipped: [],
			warnings: [],
		});
		const result = await importOpenApi({
			source: VALID_SPEC_JSON,
			filename: 'spec.json',
			targetFolder: 'tree/pets',
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(syncFromSpec).toHaveBeenCalledWith({
			targetFolder: 'tree/pets',
			spec: expect.objectContaining({ openapi: '3.0.0' }),
			specPath: 'spec.json',
		});
		expect(result.notice).toMatch(/Wrote 1 request/);
	});

	it('parses YAML input and forwards to IPC', async () => {
		syncFromSpec.mockResolvedValueOnce({
			collectionPath: 'x',
			requestPaths: [],
			overwritten: [],
			skipped: [],
			warnings: [],
		});
		const r = await importOpenApi({
			source: ['openapi: 3.0.0', 'info: { title: x, version: "1" }'].join('\n'),
			filename: 'spec.yaml',
			targetFolder: 'tree/pets',
		});
		expect(r.ok).toBe(true);
		expect(syncFromSpec).toHaveBeenCalledTimes(1);
	});

	it('rejects non-OpenAPI-3 specs before hitting IPC', async () => {
		const r = await importOpenApi({
			source: JSON.stringify({ swagger: '2.0', info: { title: 'x' } }),
			targetFolder: 'tree/pets',
		});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/OpenAPI 3\.x/);
		expect(syncFromSpec).not.toHaveBeenCalled();
	});

	it('relays sync errors from the host', async () => {
		syncFromSpec.mockRejectedValueOnce(new Error('targetFolder escapes the project root'));
		const r = await importOpenApi({
			source: VALID_SPEC_JSON,
			targetFolder: '../../etc',
		});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/escapes the project root/);
	});

	it('surfaces overwritten/skipped/warning counts in the notice string', async () => {
		syncFromSpec.mockResolvedValueOnce({
			collectionPath: '/x/_collection.json',
			requestPaths: ['a', 'b'],
			overwritten: ['a'],
			skipped: [{ path: '???', reason: 'unsafe' }],
			warnings: ['$ref skipped'],
		});
		const r = await importOpenApi({
			source: VALID_SPEC_JSON,
			targetFolder: 'tree/pets',
		});
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.notice).toMatch(/Wrote 2 requests/);
		expect(r.notice).toMatch(/Overwrote 1 existing file/);
		expect(r.notice).toMatch(/Skipped 1/);
		expect(r.notice).toMatch(/1 converter warning/);
	});
});
