import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Providers } from '../../base';
import OpenApiWriter, { sanitiseFilename } from '../openapi-writer';

function createMemoryFs() {
	const files = new Map<string, string>();
	return {
		files,
		promises: {
			mkdir: async (_dir: string, _opts?: unknown) => {
				/* memory fs has no real dirs */
			},
			writeFile: async (filePath: string, data: string, _opts?: unknown) => {
				files.set(filePath, data);
			},
			readFile: async (filePath: string) => {
				const v = files.get(filePath);
				if (v === undefined) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
				return v;
			},
			stat: async (filePath: string) => {
				if (!files.has(filePath)) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
				return { size: files.get(filePath)!.length };
			},
			rm: async (filePath: string) => {
				files.delete(filePath);
			},
		},
	};
}

function buildProviders(): { providers: Providers; fs: ReturnType<typeof createMemoryFs> } {
	const fs = createMemoryFs();
	const providers = {
		// biome-ignore lint/suspicious/noExplicitAny: tests synthesise a partial provider surface
		aes: {} as any,
		// biome-ignore lint/suspicious/noExplicitAny: see above
		credentials: {} as any,
		// biome-ignore lint/suspicious/noExplicitAny: see above
		logger: { info: () => {}, error: () => {}, warn: () => {} } as any,
		// biome-ignore lint/suspicious/noExplicitAny: see above
		storage: {} as any,
		node: {
			// biome-ignore lint/suspicious/noExplicitAny: memory fs is close enough
			fs: fs as any,
			// biome-ignore lint/suspicious/noExplicitAny: see above
			path: path as any,
		},
	} as Providers;
	return { providers, fs };
}

const TARGET = '/proj/tree/pets';

describe('sanitiseFilename', () => {
	it('strips path-breaking characters', () => {
		expect(sanitiseFilename('list / pets')).toBe('list-pets');
		expect(sanitiseFilename('list:Pets*Now?')).toBe('list-Pets-Now');
		expect(sanitiseFilename('w<i>n|q"o\\b')).toBe('w-i-n-q-o-b');
	});

	it('collapses repeats and trims edges', () => {
		expect(sanitiseFilename('---hi---')).toBe('hi');
		expect(sanitiseFilename('  spaces  in  name  ')).toBe('spaces-in-name');
	});

	it('caps very long names', () => {
		const long = 'a'.repeat(500);
		expect(sanitiseFilename(long).length).toBeLessThanOrEqual(120);
	});

	it('returns empty for input that resolves to nothing', () => {
		expect(sanitiseFilename('///')).toBe('');
		expect(sanitiseFilename('...')).toBe('');
	});
});

describe('OpenApiWriter.syncToFolder', () => {
	let providers: Providers;
	let fs: ReturnType<typeof createMemoryFs>;

	beforeEach(() => {
		({ providers, fs } = buildProviders());
	});

	it('writes _collection.json and one file per request', async () => {
		const writer = new OpenApiWriter(providers);
		const result = await writer.syncToFolder(TARGET, {
			collection: {
				source: { type: 'openapi', specPath: 'spec.yaml', lastSyncedAt: '2026-05-13T00:00:00.000Z' },
				defaults: { baseUrl: ['https://api.example.com'] },
			},
			requests: [
				{
					suggestedName: 'listPets',
					override: { id: 'r-list', operationId: 'listPets', verb: 'GET', url: ['/pets'] },
				},
				{
					suggestedName: 'getPet',
					override: { id: 'r-get', operationId: 'getPet', verb: 'GET', url: ['/pets/:id'] },
				},
			],
		});

		expect(result.collectionPath).toBe(`${TARGET}/_collection.json`);
		expect(result.requestPaths).toHaveLength(2);
		expect(fs.files.has(`${TARGET}/_collection.json`)).toBe(true);
		expect(fs.files.has(`${TARGET}/listPets.json`)).toBe(true);
		expect(fs.files.has(`${TARGET}/getPet.json`)).toBe(true);

		const collectionBack = JSON.parse(fs.files.get(`${TARGET}/_collection.json`)!);
		expect(collectionBack.source.type).toBe('openapi');
		const requestBack = JSON.parse(fs.files.get(`${TARGET}/listPets.json`)!);
		expect(requestBack.operationId).toBe('listPets');
	});

	it("reports an existing collection file as overwritten", async () => {
		const writer = new OpenApiWriter(providers);
		await writer.syncToFolder(TARGET, {
			collection: { source: { type: 'manual' } },
			requests: [],
		});
		const result = await writer.syncToFolder(TARGET, {
			collection: { source: { type: 'manual' } },
			requests: [],
		});
		expect(result.overwritten).toContain(`${TARGET}/_collection.json`);
	});

	it('dedupes filenames when two requests share a suggested name', async () => {
		const writer = new OpenApiWriter(providers);
		const result = await writer.syncToFolder(TARGET, {
			collection: { source: { type: 'manual' } },
			requests: [
				{ suggestedName: 'list', override: { id: 'a' } },
				{ suggestedName: 'list', override: { id: 'b' } },
				{ suggestedName: 'list', override: { id: 'c' } },
			],
		});
		expect(result.requestPaths).toEqual([
			`${TARGET}/list.json`,
			`${TARGET}/list-2.json`,
			`${TARGET}/list-3.json`,
		]);
	});

	it('skips requests whose name sanitises to empty', async () => {
		const writer = new OpenApiWriter(providers);
		const result = await writer.syncToFolder(TARGET, {
			collection: { source: { type: 'manual' } },
			requests: [
				{ suggestedName: '///', override: { id: 'a' } },
				{ suggestedName: 'valid', override: { id: 'b' } },
			],
		});
		expect(result.skipped).toHaveLength(1);
		expect(result.skipped[0].path).toBe('///');
		expect(result.requestPaths).toEqual([`${TARGET}/valid.json`]);
	});

	it('never lets a request claim _collection.json', async () => {
		const writer = new OpenApiWriter(providers);
		const result = await writer.syncToFolder(TARGET, {
			collection: { source: { type: 'manual' } },
			requests: [{ suggestedName: '_collection', override: { id: 'a' } }],
		});
		// `_collection` collides with the reserved name and gets bumped.
		expect(result.requestPaths).toEqual([`${TARGET}/_collection-2.json`]);
		// And the actual collection file is intact.
		const c = JSON.parse(fs.files.get(`${TARGET}/_collection.json`)!);
		expect(c.source.type).toBe('manual');
	});

	it('formats both files with tab indent + trailing newline', async () => {
		const writer = new OpenApiWriter(providers);
		await writer.syncToFolder(TARGET, {
			collection: { source: { type: 'manual' } },
			requests: [{ suggestedName: 'r', override: { id: 'a' } }],
		});
		const collection = fs.files.get(`${TARGET}/_collection.json`)!;
		expect(collection.includes('\t')).toBe(true);
		expect(collection.endsWith('\n')).toBe(true);
	});
});
