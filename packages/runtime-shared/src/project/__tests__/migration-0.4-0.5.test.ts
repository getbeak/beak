import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import nodePath, { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Providers } from '../../base';
import BeakProject from '../index';

/**
 * End-to-end migration test. A v0.4.0 project on disk should be upgraded
 * to v0.5.0 in place when readProjectFile is invoked with
 * `runMigrations: true`, with every folder under `tree/` (including the
 * root) gaining a `_collection.json` describing a `manual` source.
 *
 * Pre-existing request files must round-trip byte-identical — the
 * migration only adds collection metadata; it does not rewrite legacy
 * fully-specified requests.
 */

function makeStorage() {
	const store = new Map<string, unknown>();
	return {
		_store: store,
		async get(key: string) {
			return store.get(key);
		},
		async set(key: string, value: unknown) {
			store.set(key, value);
		},
		async has(key: string) {
			return store.has(key);
		},
	};
}

function buildProviders(): Providers {
	const storage = makeStorage();
	return {
		// biome-ignore lint/suspicious/noExplicitAny: stub
		aes: { algorithmVersionMap: {}, generateKey: async () => 'k' } as any,
		// biome-ignore lint/suspicious/noExplicitAny: stub
		credentials: { setProjectEncryption: async () => undefined } as any,
		// biome-ignore lint/suspicious/noExplicitAny: stub
		logger: { info: () => {}, error: () => {}, warn: () => {} } as any,
		// biome-ignore lint/suspicious/noExplicitAny: stub
		storage: storage as any,
		node: {
			// biome-ignore lint/suspicious/noExplicitAny: real fs satisfies the narrow surface
			fs: { promises: fs } as any,
			// biome-ignore lint/suspicious/noExplicitAny: see above
			path: nodePath as any,
		},
	} as Providers;
}

let projectRoot: string;

beforeEach(async () => {
	projectRoot = await mkdtemp(join(tmpdir(), 'beak-migration-'));
});

afterEach(async () => {
	if (projectRoot) await rm(projectRoot, { recursive: true, force: true });
});

async function seedV040Project() {
	await fs.writeFile(
		join(projectRoot, 'project.json'),
		JSON.stringify({ id: 'p1', name: 'Legacy', version: '0.4.0' }, null, '\t'),
		'utf8',
	);

	const tree = join(projectRoot, 'tree');
	await fs.mkdir(tree, { recursive: true });
	await fs.writeFile(
		join(tree, 'GetThing.json'),
		JSON.stringify({ id: 'r1', verb: 'get', url: ['https://example.com/thing'] }, null, '\t'),
		'utf8',
	);

	const nested = join(tree, 'users');
	await fs.mkdir(nested, { recursive: true });
	await fs.writeFile(
		join(nested, 'GetUser.json'),
		JSON.stringify({ id: 'r2', verb: 'get', url: ['https://example.com/users/1'] }, null, '\t'),
		'utf8',
	);

	const deeper = join(nested, 'admins');
	await fs.mkdir(deeper, { recursive: true });
	await fs.writeFile(
		join(deeper, 'Promote.json'),
		JSON.stringify({ id: 'r3', verb: 'post', url: ['https://example.com/users/1/promote'] }, null, '\t'),
		'utf8',
	);
}

describe('0.4.0 → 0.5.0 migration', () => {
	it('bumps the project version to 0.5.0', async () => {
		await seedV040Project();
		const project = new BeakProject(buildProviders());

		const file = await project.readProjectFile(projectRoot, { runMigrations: true });
		expect(file?.version).toBe('0.5.0');

		const onDisk = JSON.parse(await fs.readFile(join(projectRoot, 'project.json'), 'utf8'));
		expect(onDisk.version).toBe('0.5.0');
		expect(onDisk.id).toBe('p1');
		expect(onDisk.name).toBe('Legacy');
	});

	it('writes a manual-source _collection.json into every folder under tree/', async () => {
		await seedV040Project();
		const project = new BeakProject(buildProviders());
		await project.readProjectFile(projectRoot, { runMigrations: true });

		for (const folder of ['tree', 'tree/users', 'tree/users/admins']) {
			const path = join(projectRoot, folder, '_collection.json');
			const content = JSON.parse(await fs.readFile(path, 'utf8'));
			expect(content).toEqual({ source: { type: 'manual' } });
		}
	});

	it('leaves existing request files untouched (byte-identical)', async () => {
		await seedV040Project();
		const before = await fs.readFile(join(projectRoot, 'tree', 'GetThing.json'), 'utf8');
		const beforeNested = await fs.readFile(join(projectRoot, 'tree', 'users', 'GetUser.json'), 'utf8');
		const beforeDeep = await fs.readFile(join(projectRoot, 'tree', 'users', 'admins', 'Promote.json'), 'utf8');

		const project = new BeakProject(buildProviders());
		await project.readProjectFile(projectRoot, { runMigrations: true });

		const after = await fs.readFile(join(projectRoot, 'tree', 'GetThing.json'), 'utf8');
		const afterNested = await fs.readFile(join(projectRoot, 'tree', 'users', 'GetUser.json'), 'utf8');
		const afterDeep = await fs.readFile(join(projectRoot, 'tree', 'users', 'admins', 'Promote.json'), 'utf8');

		expect(after).toBe(before);
		expect(afterNested).toBe(beforeNested);
		expect(afterDeep).toBe(beforeDeep);
	});

	it('is idempotent — re-running migrations on an already-0.5.0 project is a no-op', async () => {
		await seedV040Project();
		const project = new BeakProject(buildProviders());
		await project.readProjectFile(projectRoot, { runMigrations: true });

		const collectionBefore = await fs.readFile(join(projectRoot, 'tree', '_collection.json'), 'utf8');
		const versionBefore = JSON.parse(await fs.readFile(join(projectRoot, 'project.json'), 'utf8')).version;

		await project.readProjectFile(projectRoot, { runMigrations: true });

		const collectionAfter = await fs.readFile(join(projectRoot, 'tree', '_collection.json'), 'utf8');
		const versionAfter = JSON.parse(await fs.readFile(join(projectRoot, 'project.json'), 'utf8')).version;

		expect(collectionAfter).toBe(collectionBefore);
		expect(versionAfter).toBe(versionBefore);
	});
});
