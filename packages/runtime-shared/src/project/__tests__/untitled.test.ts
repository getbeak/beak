import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import nodePath, { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Providers } from '../../base';
import BeakProject from '../index';

/**
 * Untitled scratch projects live in a temp folder until the user "promotes"
 * them to a real location. These tests assert the on-disk + recents shape
 * for both creation and promotion.
 */

interface StorageStub {
	get: (key: string) => Promise<unknown>;
	set: (key: string, value: unknown) => Promise<void>;
	has: (key: string) => Promise<boolean>;
}

function makeStorage(): StorageStub & { _store: Map<string, unknown> } {
	const _store = new Map<string, unknown>();
	return {
		_store,
		async get(key) {
			return _store.get(key);
		},
		async set(key, value) {
			_store.set(key, value);
		},
		async has(key) {
			return _store.has(key);
		},
	};
}

function buildProviders(): { providers: Providers; storage: ReturnType<typeof makeStorage> } {
	const storage = makeStorage();
	return {
		storage,
		providers: {
			// biome-ignore lint/suspicious/noExplicitAny: stub
			aes: {
				algorithmVersionMap: { '2020-01-25': 'aes-256-gcm' },
				generateKey: async () => 'k',
			} as any,
			// biome-ignore lint/suspicious/noExplicitAny: stub
			credentials: { setProjectEncryption: async () => undefined } as any,
			// biome-ignore lint/suspicious/noExplicitAny: stub
			logger: { info: () => {}, error: () => {}, warn: () => {} } as any,
			// biome-ignore lint/suspicious/noExplicitAny: storage stub
			storage: storage as any,
			node: {
				// biome-ignore lint/suspicious/noExplicitAny: real fs satisfies the narrow surface
				fs: { promises: fs } as any,
				// biome-ignore lint/suspicious/noExplicitAny: see above
				path: nodePath as any,
			},
		} as Providers,
	};
}

let workspace: string;

beforeEach(async () => {
	workspace = await mkdtemp(join(tmpdir(), 'beak-untitled-'));
});

afterEach(async () => {
	if (workspace) await rm(workspace, { recursive: true, force: true });
});

describe('BeakProject.create — untitled scratch projects', () => {
	it('marks the on-disk project.json with untitled: true when the option is set', async () => {
		const { providers } = buildProviders();
		const project = new BeakProject(providers);
		const parent = join(workspace, 'untitled-projects');
		await fs.mkdir(parent, { recursive: true });

		const created = await project.create('Untitled', parent, {
			useProjectIdAsProjectFolder: true,
			skipRecents: true,
			untitled: true,
		});

		const projectJson = JSON.parse(await fs.readFile(created.projectFilePath, 'utf8'));
		expect(projectJson.untitled).toBe(true);
		expect(projectJson.name).toBe('Untitled');
		expect(projectJson.id).toBe(created.projectId);
	});

	it('does not add untitled projects to the recents store when skipRecents is set', async () => {
		const { providers, storage } = buildProviders();
		const project = new BeakProject(providers);
		const parent = join(workspace, 'untitled-projects');
		await fs.mkdir(parent, { recursive: true });

		await project.create('Untitled', parent, {
			useProjectIdAsProjectFolder: true,
			skipRecents: true,
			untitled: true,
		});

		expect(storage._store.has('recents')).toBe(false);
	});

	it('does add regular projects to recents (sanity)', async () => {
		const { providers, storage } = buildProviders();
		const project = new BeakProject(providers);

		await project.create('Real Project', workspace);

		const recents = storage._store.get('recents') as Array<{ name: string }>;
		expect(recents).toHaveLength(1);
		expect(recents[0].name).toBe('Real Project');
	});
});

describe('BeakProject.promoteUntitled', () => {
	it('renames the folder, clears untitled, and writes a recents entry', async () => {
		const { providers, storage } = buildProviders();
		const project = new BeakProject(providers);
		const parent = join(workspace, 'untitled-projects');
		await fs.mkdir(parent, { recursive: true });

		const { projectId } = await project.create('Untitled', parent, {
			useProjectIdAsProjectFolder: true,
			skipRecents: true,
			untitled: true,
		});

		const oldFolder = join(parent, projectId);
		const newFolder = join(workspace, 'my-real-project');

		const promoted = await project.promoteUntitled(oldFolder, newFolder, 'My Real Project');

		expect(promoted.projectId).toBe(projectId);

		await expect(fs.stat(oldFolder)).rejects.toMatchObject({ code: 'ENOENT' });

		const projectJson = JSON.parse(await fs.readFile(join(newFolder, 'project.json'), 'utf8'));
		expect(projectJson.untitled).toBeUndefined();
		expect(projectJson.name).toBe('My Real Project');
		expect(projectJson.id).toBe(projectId);

		const recents = storage._store.get('recents') as Array<{ name: string; path: string }>;
		expect(recents).toHaveLength(1);
		expect(recents[0]).toMatchObject({ name: 'My Real Project', path: newFolder });
	});

	it('refuses to promote a non-untitled project', async () => {
		const { providers } = buildProviders();
		const project = new BeakProject(providers);

		const { projectId } = await project.create('Real', workspace);
		const oldFolder = join(workspace, 'Real');
		const newFolder = join(workspace, 'somewhere-else');

		await expect(project.promoteUntitled(oldFolder, newFolder)).rejects.toThrow(
			/is not untitled/,
		);
		// projectId returned by create is used to keep the linter happy + asserts
		// the project was actually written first.
		expect(projectId).toBeTruthy();
	});

	it('refuses to clobber an existing target folder', async () => {
		const { providers } = buildProviders();
		const project = new BeakProject(providers);
		const parent = join(workspace, 'untitled-projects');
		await fs.mkdir(parent, { recursive: true });

		const { projectId } = await project.create('Untitled', parent, {
			useProjectIdAsProjectFolder: true,
			skipRecents: true,
			untitled: true,
		});

		const oldFolder = join(parent, projectId);
		const target = join(workspace, 'collision');
		await fs.mkdir(target);

		await expect(project.promoteUntitled(oldFolder, target)).rejects.toThrow(/already exists/);
	});
});
