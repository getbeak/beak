import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import nodePath, { join } from 'node:path';
import type { OpenApiDocument } from '@beak/state/sources/openapi';
import { openapiToCollection } from '@beak/state/sources/openapi';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import AssetStore from '../assets';
import AssetGc from '../assets/gc';
import type { Providers } from '../base';
import OpenApiWriter from '../sources/openapi-writer';

/**
 * End-to-end host pipeline tests. These exercise the runtime against the
 * real filesystem (in a tmp dir) so we catch regressions where the
 * runtime-shared classes drift from how `providers.node.fs` actually
 * behaves. Each test creates and tears down its own tmp project so they
 * stay independent.
 */

function buildProviders(): Providers {
	return {
		// biome-ignore lint/suspicious/noExplicitAny: tests synthesise a partial surface
		aes: {} as any,
		// biome-ignore lint/suspicious/noExplicitAny: see above
		credentials: {} as any,
		// biome-ignore lint/suspicious/noExplicitAny: see above
		logger: { info: () => {}, error: () => {}, warn: () => {} } as any,
		// biome-ignore lint/suspicious/noExplicitAny: see above
		storage: {} as any,
		node: {
			// biome-ignore lint/suspicious/noExplicitAny: real fs / path satisfy the runtime's narrow surface
			fs: { promises: fs } as any,
			// biome-ignore lint/suspicious/noExplicitAny: see above
			path: nodePath as any,
		},
	} as Providers;
}

let projectRoot: string;

beforeEach(async () => {
	projectRoot = await mkdtemp(join(tmpdir(), 'beak-e2e-'));
});

afterEach(async () => {
	if (projectRoot) await rm(projectRoot, { recursive: true, force: true });
});

describe('e2e: AssetStore against real fs', () => {
	it('writes a buffer to the sharded path and reads it back identically', async () => {
		const providers = buildProviders();
		const store = new AssetStore(providers);
		const bytes = new TextEncoder().encode('hello world');

		const ref = await store.write(projectRoot, bytes, 'text/plain');
		expect(ref.sha256).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');

		const onDisk = await fs.readFile(join(projectRoot, '_assets', 'b9', ref.sha256));
		expect(new TextDecoder().decode(onDisk)).toBe('hello world');

		const readBack = await store.read(projectRoot, ref);
		expect(readBack && new TextDecoder().decode(readBack)).toBe('hello world');
		expect(await store.exists(projectRoot, ref)).toBe(true);

		await store.delete(projectRoot, ref);
		expect(await store.exists(projectRoot, ref)).toBe(false);
		expect(await store.read(projectRoot, ref)).toBeNull();
	});
});

const PET_STORE: OpenApiDocument = {
	openapi: '3.0.0',
	info: { title: 'Pet Store', version: '1.0.0' },
	servers: [{ url: 'https://api.example.com/v1' }],
	paths: {
		'/pets': {
			get: {
				operationId: 'listPets',
				parameters: [
					{ name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } },
					{ $ref: '#/components/parameters/Trace' },
				],
			},
		},
		'/pets/{id}': {
			parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
			get: { operationId: 'getPet' },
		},
	},
	components: {
		parameters: {
			Trace: { name: 'X-Trace', in: 'header', required: true, schema: { type: 'string' } },
		},
	},
};

describe('e2e: OpenAPI converter → writer → real fs round trip', () => {
	it('produces a _collection.json + one file per operation on disk', async () => {
		const providers = buildProviders();
		const writer = new OpenApiWriter(providers);

		const result = openapiToCollection(PET_STORE, {
			specPath: 'spec.yaml',
			now: () => '2026-05-13T00:00:00.000Z',
		});
		const targetFolder = join(projectRoot, 'tree', 'pets');
		const writeResult = await writer.syncToFolder(targetFolder, {
			collection: result.collection,
			requests: result.requests,
			variableSet: result.variableSet,
			folderName: 'pets',
			projectRoot,
		});

		expect(writeResult.collectionPath).toBe(join(targetFolder, '_collection.json'));
		expect(writeResult.requestPaths.length).toBe(result.requests.length);

		// Read the collection file back and verify the source declaration.
		const collectionRaw = await fs.readFile(writeResult.collectionPath, 'utf8');
		const collection = JSON.parse(collectionRaw);
		expect(collection.source.type).toBe('openapi');
		expect(collection.source.specPath).toBe('spec.yaml');

		// baseUrl now points at the merged Environments variable-set item; the
		// literal URL lives in the variable set's values map.
		const baseUrlPart = collection.defaults.baseUrl[0];
		expect(baseUrlPart.type).toBe('variable_set_item');
		expect(typeof baseUrlPart.payload.itemId).toBe('string');

		expect(writeResult.variableSetPath).toBe(join(projectRoot, 'variable-sets', 'Environments.json'));
		const varSet = JSON.parse(await fs.readFile(writeResult.variableSetPath!, 'utf8'));
		expect(Object.values(varSet.items)).toContain('pets.baseUrl');
		expect(Object.values(varSet.values)).toContainEqual(['https://api.example.com/v1']);

		// listPets request should carry the resolved Trace header from $ref.
		const listPetsPath = writeResult.requestPaths.find(p => p.endsWith('listPets.json'));
		expect(listPetsPath).toBeDefined();
		const listPets = JSON.parse(await fs.readFile(listPetsPath!, 'utf8'));
		expect(listPets.operationId).toBe('listPets');
		expect(listPets.headers?.['X-Trace']?.enabled).toBe(true);

		// And the on-disk JSON matches the schema-on-the-tin: id present, sparse override.
		expect(typeof listPets.id).toBe('string');
		expect(listPets.id.length).toBeGreaterThan(0);
	});

	it('overwriting reports each pre-existing file under overwritten', async () => {
		const providers = buildProviders();
		const writer = new OpenApiWriter(providers);
		const result = openapiToCollection(PET_STORE, { now: () => 'x' });
		const targetFolder = join(projectRoot, 'tree', 'pets');

		await writer.syncToFolder(targetFolder, {
			collection: result.collection,
			requests: result.requests,
		});
		const second = await writer.syncToFolder(targetFolder, {
			collection: result.collection,
			requests: result.requests,
		});

		// Every file from the first sync is reported as overwritten on the second.
		expect(second.overwritten).toContain(join(targetFolder, '_collection.json'));
		for (const p of second.requestPaths) expect(second.overwritten).toContain(p);
	});
});

describe('e2e: AssetGc identifies orphans on a real project', () => {
	it('reports stored shas that nothing in tree/ references', async () => {
		const providers = buildProviders();
		const store = new AssetStore(providers);
		const gc = new AssetGc(providers);

		// Set up: write two assets, but only reference one from tree/.
		const keeper = await store.write(projectRoot, new TextEncoder().encode('keep me'));
		const orphan = await store.write(projectRoot, new TextEncoder().encode('discard me'));

		await fs.mkdir(join(projectRoot, 'tree'), { recursive: true });
		await fs.writeFile(
			join(projectRoot, 'tree', 'r.json'),
			JSON.stringify({ id: 'r', body: { type: 'file', payload: { assetRef: keeper } } }),
			'utf8',
		);

		const orphans = await gc.findOrphans(projectRoot);
		expect(orphans).toEqual([orphan.sha256]);

		const removed = await gc.delete(projectRoot, orphans);
		expect(removed).toEqual([orphan.sha256]);
		// And the keeper survives.
		expect(await store.exists(projectRoot, keeper)).toBe(true);
	});
});
