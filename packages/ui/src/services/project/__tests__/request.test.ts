import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@beak/ui/lib/ipc', () => ({
	ipcFsService: {
		pathExists: vi.fn(),
		readJson: vi.fn(),
		writeJson: vi.fn(),
	},
}));

const { ipcFsService } = await import('@beak/ui/lib/ipc');
const { readRequestNode, writeRequestNode } = await import('../request');

const pathExists = ipcFsService.pathExists as ReturnType<typeof vi.fn>;
const readJson = ipcFsService.readJson as ReturnType<typeof vi.fn>;
const writeJson = ipcFsService.writeJson as ReturnType<typeof vi.fn>;

function reset() {
	pathExists.mockReset();
	readJson.mockReset();
	writeJson.mockReset();
}

describe('readRequestNode (no collection / empty defaults)', () => {
	beforeEach(reset);

	it('reads a full request file and returns a valid node (legacy path)', async () => {
		// collection lookup: no _collection.json anywhere
		pathExists.mockResolvedValue(false);
		// request file read
		readJson.mockResolvedValueOnce({
			id: 'r1',
			verb: 'GET',
			url: ['https://example.com'],
			query: {},
			headers: {},
		});

		const node = await readRequestNode('tree/users/list.json');
		expect(node.mode).toBe('valid');
		if (node.mode !== 'valid') return;
		expect(node.id).toBe('r1');
		expect(node.info.verb).toBe('GET');
	});

	it('returns a failed-mode node when the file is malformed', async () => {
		pathExists.mockResolvedValue(false);
		readJson.mockResolvedValueOnce({ id: '', verb: 'GET' }); // empty id violates schema

		const node = await readRequestNode('tree/users/list.json');
		expect(node.mode).toBe('failed');
	});
});

describe('readRequestNode (collection defaults active)', () => {
	beforeEach(reset);

	it('merges the collection baseUrl into a sparse override', async () => {
		// pathExists → true for the collection file
		pathExists.mockResolvedValueOnce(true);
		readJson
			.mockResolvedValueOnce({
				source: { type: 'manual' },
				defaults: { baseUrl: ['https://api.example.com'] },
			}) // _collection.json
			.mockResolvedValueOnce({ id: 'r1' }); // sparse request file — just id

		const node = await readRequestNode('tree/users/list.json');
		expect(node.mode).toBe('valid');
		if (node.mode !== 'valid') return;
		expect(node.info.url).toEqual(['https://api.example.com']);
		expect(node.info.verb).toBe('GET'); // fallback when neither side declares
	});

	it('lets the override win over the default url', async () => {
		pathExists.mockResolvedValueOnce(true);
		readJson
			.mockResolvedValueOnce({
				source: { type: 'manual' },
				defaults: { baseUrl: ['https://api.example.com'] },
			})
			.mockResolvedValueOnce({
				id: 'r1',
				verb: 'POST',
				url: ['https://override.example.com/x'],
			});

		const node = await readRequestNode('tree/users/list.json');
		expect(node.mode).toBe('valid');
		if (node.mode !== 'valid') return;
		expect(node.info.url).toEqual(['https://override.example.com/x']);
		expect(node.info.verb).toBe('POST');
	});
});

describe('writeRequestNode (collection defaults active)', () => {
	beforeEach(reset);

	it('writes a sparse override that omits fields equal to defaults', async () => {
		// pathExists for _collection.json → true
		pathExists.mockResolvedValueOnce(true);
		readJson.mockResolvedValueOnce({
			source: { type: 'manual' },
			defaults: {
				baseUrl: ['https://api.example.com'],
				verb: 'GET',
				headers: { Accept: { name: 'Accept', value: ['application/json'], enabled: true } },
			},
		});
		writeJson.mockResolvedValueOnce(undefined);

		await writeRequestNode({
			type: 'request',
			id: 'r1',
			name: 'list',
			filePath: 'tree/users/list.json',
			parent: 'tree/users',
			mode: 'valid',
			info: {
				verb: 'GET',
				url: ['https://api.example.com'],
				query: {},
				headers: { Accept: { name: 'Accept', value: ['application/json'], enabled: true } },
				body: { type: 'text', payload: '' },
				options: { followRedirects: false },
			},
		} as never);

		expect(writeJson).toHaveBeenCalledTimes(1);
		const [, payload] = writeJson.mock.calls[0];
		// All fields matched defaults — only id, body (no default), and options
		// (differs) should be present.
		expect(payload).toMatchObject({ id: 'r1' });
		expect(payload.verb).toBeUndefined();
		expect(payload.url).toBeUndefined();
		expect(payload.headers).toBeUndefined();
	});

	it('falls back to writing the full file when there are no collection defaults', async () => {
		pathExists.mockResolvedValueOnce(false); // no collection file
		writeJson.mockResolvedValueOnce(undefined);

		await writeRequestNode({
			type: 'request',
			id: 'r1',
			name: 'list',
			filePath: 'tree/users/list.json',
			parent: 'tree/users',
			mode: 'valid',
			info: {
				verb: 'GET',
				url: ['https://example.com'],
				query: {},
				headers: {},
				body: { type: 'text', payload: '' },
				options: { followRedirects: false },
			},
		} as never);

		expect(writeJson).toHaveBeenCalledTimes(1);
		const [, payload] = writeJson.mock.calls[0];
		expect(payload.verb).toBe('GET');
		expect(payload.url).toEqual(['https://example.com']);
	});
});
