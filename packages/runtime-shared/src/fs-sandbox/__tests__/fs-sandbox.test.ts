import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import nodePath, { join } from 'node:path';

import Squawk from '@beak/common/utils/squawk';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Providers } from '../../base';
import BeakProject from '../../project';
import { FsSandbox } from '..';

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

let projectRoot: string;
let sandbox: FsSandbox;

beforeEach(async () => {
	projectRoot = await mkdtemp(join(tmpdir(), 'beak-sandbox-'));
	await fs.writeFile(
		join(projectRoot, 'project.json'),
		JSON.stringify({ id: 'p1', version: '0.5.0', name: 'Sandbox Test' }),
		'utf8',
	);
	const providers = buildProviders();
	const project = new BeakProject(providers, { defaultRecentSource: 'desktop' });
	sandbox = new FsSandbox(providers, project);
});

afterEach(async () => {
	if (projectRoot) await rm(projectRoot, { recursive: true, force: true });
});

describe('FsSandbox.ensureWithinProject — happy path', () => {
	it('resolves a path inside the project root', async () => {
		const resolved = await sandbox.ensureWithinProject(projectRoot, 'tree/users/get-user.json');
		expect(resolved).toBe(nodePath.resolve(projectRoot, 'tree/users/get-user.json'));
	});

	it('accepts the project root itself as a valid resolved path', async () => {
		const resolved = await sandbox.ensureWithinProject(projectRoot, '.');
		expect(resolved).toBe(nodePath.resolve(projectRoot));
	});

	it('normalises redundant `./` and trailing slashes', async () => {
		const resolved = await sandbox.ensureWithinProject(projectRoot, './tree//users/');
		expect(resolved).toBe(nodePath.resolve(projectRoot, 'tree/users'));
	});
});

describe('FsSandbox.ensureWithinProject — sandbox enforcement', () => {
	it('rejects path traversal via ../', async () => {
		await expect(sandbox.ensureWithinProject(projectRoot, '../../../etc/passwd')).rejects.toThrowError(
			/path_not_within_project/,
		);
	});

	/**
	 * Absolute-looking inputs aren't rejected — `path.join(projectDir, '/x')`
	 * clamps them under the project. This documents that behaviour: the
	 * caller can't escape the sandbox via an absolute path, it just lands
	 * inside the project root instead. Renderer code never sends absolute
	 * paths in practice; this is defence-in-depth.
	 */
	it('clamps absolute-looking inputs under the project root rather than honouring them', async () => {
		const resolved = await sandbox.ensureWithinProject(projectRoot, '/tmp/some-other-file');
		expect(resolved.startsWith(`${nodePath.resolve(projectRoot)}${nodePath.sep}`)).toBe(true);
		expect(resolved.endsWith(`${nodePath.sep}some-other-file`)).toBe(true);
	});

	/**
	 * The C3 regression target — web host's previous `startsWith(projectDir)`
	 * (no path-separator anchor) accepted a sibling whose name shared a
	 * prefix with the project directory: `/p/Cool-evil/...` matched against
	 * a project at `/p/Cool/`. The unified helper uses
	 * `startsWith(projectDir + path.sep)` to anchor at a segment boundary.
	 */
	it('does NOT accept sibling paths that share a name prefix with the project', async () => {
		// Set up a sibling whose name shares a prefix with the project's basename.
		// e.g. project is `/tmp/.../beak-sandbox-XYZ`; sibling is `/tmp/.../beak-sandbox-XYZ-evil`.
		const siblingDir = `${projectRoot}-evil`;
		await fs.mkdir(siblingDir, { recursive: true });
		await fs.writeFile(join(siblingDir, 'secret.txt'), 'sensitive', 'utf8');
		try {
			await expect(
				sandbox.ensureWithinProject(projectRoot, `../${nodePath.basename(siblingDir)}/secret.txt`),
			).rejects.toThrowError(/path_not_within_project/);
		} finally {
			await rm(siblingDir, { recursive: true, force: true });
		}
	});
});

describe('FsSandbox.ensureWithinProject — project file validation', () => {
	it('throws path_not_project when project.json is missing', async () => {
		const empty = await mkdtemp(join(tmpdir(), 'beak-sandbox-empty-'));
		try {
			await expect(sandbox.ensureWithinProject(empty, '.')).rejects.toBeInstanceOf(Squawk);
			await expect(sandbox.ensureWithinProject(empty, '.')).rejects.toThrowError(/path_not_project/);
		} finally {
			await rm(empty, { recursive: true, force: true });
		}
	});

	it('throws path_project_invalid when required fields are missing', async () => {
		const broken = await mkdtemp(join(tmpdir(), 'beak-sandbox-broken-'));
		try {
			await fs.writeFile(join(broken, 'project.json'), JSON.stringify({ id: 'x' }), 'utf8');
			await expect(sandbox.ensureWithinProject(broken, '.')).rejects.toThrowError(/path_project_invalid/);
		} finally {
			await rm(broken, { recursive: true, force: true });
		}
	});
});
