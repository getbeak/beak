import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import nodePath, { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Providers } from '../../base';
import { ProjectExtensions } from '../project-extensions';

function buildProviders(): Providers {
	return {
		// biome-ignore lint/suspicious/noExplicitAny: stub
		aes: { algorithmVersionMap: {}, generateKey: async () => 'k' } as any,
		// biome-ignore lint/suspicious/noExplicitAny: stub
		credentials: { setProjectEncryption: async () => undefined } as any,
		// biome-ignore lint/suspicious/noExplicitAny: stub
		logger: { info: () => {}, error: () => {}, warn: () => {} } as any,
		// biome-ignore lint/suspicious/noExplicitAny: stub
		storage: { get: async () => undefined, set: async () => {}, has: async () => false } as any,
		node: {
			// biome-ignore lint/suspicious/noExplicitAny: real fs satisfies the narrow surface
			fs: { promises: fs } as any,
			// biome-ignore lint/suspicious/noExplicitAny: see above
			path: nodePath as any,
		},
	} as Providers;
}

async function writeJson(p: string, value: unknown): Promise<void> {
	await fs.writeFile(p, JSON.stringify(value), 'utf8');
}

async function writeBeakPackage(folder: string, opts: { version?: string } = {}): Promise<void> {
	await fs.mkdir(folder, { recursive: true });
	await writeJson(join(folder, 'package.json'), {
		name: nodePath.basename(folder),
		version: opts.version ?? '1.2.3',
		beak: { apiVersion: 1 },
	});
}

async function writeNonBeakPackage(folder: string): Promise<void> {
	await fs.mkdir(folder, { recursive: true });
	await writeJson(join(folder, 'package.json'), { name: 'transitive', version: '0.0.1' });
}

interface Harness {
	extensionsDir: string;
	ext: ProjectExtensions;
	cleanup: () => Promise<void>;
}

async function setup(): Promise<Harness> {
	const extensionsDir = await mkdtemp(join(tmpdir(), 'beak-extensions-'));
	const ext = new ProjectExtensions(buildProviders());
	return {
		extensionsDir,
		ext,
		cleanup: async () => {
			await rm(extensionsDir, { recursive: true, force: true });
		},
	};
}

async function withHarness(fn: (h: Harness) => Promise<void>): Promise<void> {
	const harness = await setup();
	try {
		await fn(harness);
	} finally {
		await harness.cleanup();
	}
}

describe('ProjectExtensions.listInstalled', () => {
	it('returns [] when node_modules does not exist', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			const installed = await ext.listInstalled(extensionsDir);
			expect(installed).toEqual([]);
		});
	});

	it('returns [] when node_modules exists but is empty', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await fs.mkdir(join(extensionsDir, 'node_modules'), { recursive: true });
			const installed = await ext.listInstalled(extensionsDir);
			expect(installed).toEqual([]);
		});
	});

	it('enumerates flat Beak packages', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await writeBeakPackage(join(extensionsDir, 'node_modules', 'acme-vars'), { version: '0.2.0' });
			const installed = await ext.listInstalled(extensionsDir);
			expect(installed).toHaveLength(1);
			expect(installed[0].packageName).toBe('acme-vars');
			expect(installed[0].version).toBe('0.2.0');
		});
	});

	it('enumerates scoped Beak packages', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await writeBeakPackage(join(extensionsDir, 'node_modules', '@scope', 'pkg'), { version: '0.3.0' });
			const installed = await ext.listInstalled(extensionsDir);
			expect(installed).toHaveLength(1);
			expect(installed[0].packageName).toBe('@scope/pkg');
		});
	});

	it('skips non-Beak transitive dependencies', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await writeBeakPackage(join(extensionsDir, 'node_modules', 'acme-vars'));
			await writeNonBeakPackage(join(extensionsDir, 'node_modules', 'lodash'));
			const installed = await ext.listInstalled(extensionsDir);
			expect(installed).toHaveLength(1);
			expect(installed[0].packageName).toBe('acme-vars');
		});
	});

	it('skips dot-prefixed entries (.bin, .package-lock.json)', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await fs.mkdir(join(extensionsDir, 'node_modules', '.bin'), { recursive: true });
			await writeBeakPackage(join(extensionsDir, 'node_modules', 'acme-vars'));
			const installed = await ext.listInstalled(extensionsDir);
			expect(installed.map(i => i.packageName)).toEqual(['acme-vars']);
		});
	});

	it('defaults missing package.json version to 0.0.0', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			const pkgDir = join(extensionsDir, 'node_modules', 'no-version');
			await fs.mkdir(pkgDir, { recursive: true });
			await writeJson(join(pkgDir, 'package.json'), { name: 'no-version', beak: { apiVersion: 1 } });
			const installed = await ext.listInstalled(extensionsDir);
			expect(installed[0].version).toBe('0.0.0');
		});
	});

	it('returns an absolute path that points at the package', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await writeBeakPackage(join(extensionsDir, 'node_modules', 'acme-vars'));
			const installed = await ext.listInstalled(extensionsDir);
			expect(installed[0].absolutePath).toBe(nodePath.resolve(extensionsDir, 'node_modules', 'acme-vars'));
		});
	});
});

describe('ProjectExtensions.ensureScaffold', () => {
	it('creates the node_modules directory and a default manifest', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await ext.ensureScaffold(extensionsDir);
			const stat = await fs.stat(join(extensionsDir, 'node_modules'));
			expect(stat.isDirectory()).toBe(true);
			const manifest = await ext.readManifest(extensionsDir);
			expect(manifest?.name).toBe('beak-project-extensions');
			expect(manifest?.private).toBe(true);
			expect(manifest?.dependencies).toEqual({});
		});
	});

	it('is idempotent — does not clobber an existing manifest', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await ext.ensureScaffold(extensionsDir);
			await ext.addDependency(extensionsDir, 'acme-vars', '0.2.0');
			await ext.ensureScaffold(extensionsDir);
			const manifest = await ext.readManifest(extensionsDir);
			expect(manifest?.dependencies['acme-vars']).toBe('^0.2.0');
		});
	});
});

describe('ProjectExtensions.readManifest', () => {
	it('returns null when the manifest is missing', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			expect(await ext.readManifest(extensionsDir)).toBeNull();
		});
	});

	it('returns null when the manifest is unparseable JSON', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await fs.writeFile(join(extensionsDir, 'package.json'), '{ not json', 'utf8');
			expect(await ext.readManifest(extensionsDir)).toBeNull();
		});
	});
});

describe('ProjectExtensions.addDependency', () => {
	it('creates the manifest if missing and adds a caret range', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await ext.addDependency(extensionsDir, 'acme-vars', '0.2.0');
			const manifest = await ext.readManifest(extensionsDir);
			expect(manifest?.dependencies['acme-vars']).toBe('^0.2.0');
		});
	});

	it('overrides an existing version', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await ext.addDependency(extensionsDir, 'acme-vars', '0.2.0');
			await ext.addDependency(extensionsDir, 'acme-vars', '1.0.0');
			const manifest = await ext.readManifest(extensionsDir);
			expect(manifest?.dependencies['acme-vars']).toBe('^1.0.0');
		});
	});

	it('preserves other dependencies', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await ext.addDependency(extensionsDir, 'one', '1.0.0');
			await ext.addDependency(extensionsDir, 'two', '2.0.0');
			const manifest = await ext.readManifest(extensionsDir);
			expect(manifest?.dependencies).toEqual({ one: '^1.0.0', two: '^2.0.0' });
		});
	});
});

describe('ProjectExtensions.removeDependency', () => {
	it('removes a single dependency', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await ext.addDependency(extensionsDir, 'one', '1.0.0');
			await ext.addDependency(extensionsDir, 'two', '2.0.0');
			await ext.removeDependency(extensionsDir, 'one');
			const manifest = await ext.readManifest(extensionsDir);
			expect(manifest?.dependencies).toEqual({ two: '^2.0.0' });
		});
	});

	it('is a no-op when the manifest is missing', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await expect(ext.removeDependency(extensionsDir, 'nope')).resolves.toBeUndefined();
		});
	});

	it('is a no-op when the dependency is not present', async () => {
		await withHarness(async ({ extensionsDir, ext }) => {
			await ext.addDependency(extensionsDir, 'one', '1.0.0');
			await ext.removeDependency(extensionsDir, 'absent');
			const manifest = await ext.readManifest(extensionsDir);
			expect(manifest?.dependencies).toEqual({ one: '^1.0.0' });
		});
	});
});
