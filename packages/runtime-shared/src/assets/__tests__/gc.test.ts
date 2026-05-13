import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Providers } from '../../base';
import AssetGc, { collectShas } from '../gc';

interface Entry {
	name: string;
	isDirectory: () => boolean;
	isFile: () => boolean;
}

function makeFs() {
	const files = new Map<string, string | Uint8Array>();
	const dirs = new Set<string>();

	function ensureDir(p: string) {
		dirs.add(p);
		const parent = path.dirname(p);
		if (parent && parent !== p) dirs.add(parent);
	}
	function writeFileSync(p: string, data: string | Uint8Array) {
		files.set(p, data);
		ensureDir(path.dirname(p));
	}

	const fs = {
		files,
		dirs,
		writeFileSync,
		promises: {
			mkdir: async (p: string, _opts?: unknown) => {
				ensureDir(p);
			},
			writeFile: async (p: string, data: string | Uint8Array) => {
				writeFileSync(p, data);
			},
			readFile: async (p: string, _enc?: string) => {
				if (!files.has(p)) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
				const v = files.get(p)!;
				return typeof v === 'string' ? v : new TextDecoder().decode(v);
			},
			stat: async (p: string) => {
				if (files.has(p) || dirs.has(p)) return { size: 0 };
				throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
			},
			readdir: async (p: string, opts?: { withFileTypes?: boolean }) => {
				const childSet = new Set<string>();
				for (const f of files.keys()) {
					if (f.startsWith(`${p}/`)) {
						const rest = f.slice(p.length + 1);
						const head = rest.split('/')[0];
						if (head) childSet.add(head);
					}
				}
				for (const d of dirs) {
					if (d.startsWith(`${p}/`)) {
						const rest = d.slice(p.length + 1);
						const head = rest.split('/')[0];
						if (head) childSet.add(head);
					}
				}
				const names = [...childSet].sort();
				if (!opts?.withFileTypes) return names;
				return names.map<Entry>(name => {
					const full = `${p}/${name}`;
					const isFile = files.has(full);
					const isDir = !isFile;
					return {
						name,
						isDirectory: () => isDir,
						isFile: () => isFile,
					};
				});
			},
			rm: async (p: string, _opts?: unknown) => {
				files.delete(p);
			},
		},
	};

	return fs;
}

function buildProviders(): { providers: Providers; fs: ReturnType<typeof makeFs> } {
	const fs = makeFs();
	const providers = {
		// biome-ignore lint/suspicious/noExplicitAny: tests synthesise a partial surface
		aes: {} as any,
		// biome-ignore lint/suspicious/noExplicitAny: see above
		credentials: {} as any,
		// biome-ignore lint/suspicious/noExplicitAny: see above
		logger: { info: () => {}, error: () => {}, warn: () => {} } as any,
		// biome-ignore lint/suspicious/noExplicitAny: see above
		storage: {} as any,
		node: {
			// biome-ignore lint/suspicious/noExplicitAny: memory fs is structurally compatible
			fs: fs as any,
			// biome-ignore lint/suspicious/noExplicitAny: see above
			path: path as any,
		},
	} as Providers;
	return { providers, fs };
}

const PROJECT = '/proj';
const SHA_A = '0000000000000000000000000000000000000000000000000000000000000000';
const SHA_B = '1111111111111111111111111111111111111111111111111111111111111111';
const SHA_C = 'cafe1111111111111111111111111111111111111111111111111111111111ff';

describe('collectShas', () => {
	it('finds shas nested deep inside a request file', () => {
		const into = new Set<string>();
		collectShas({
			id: 'r1',
			body: { type: 'file', payload: { assetRef: { sha256: SHA_A, size: 4 } } },
			headers: { Auth: { name: 'Auth', value: [{ type: 'asset', payload: { sha256: SHA_B } }] } },
		}, into);
		expect(into).toEqual(new Set([SHA_A, SHA_B]));
	});

	it('ignores non-hex sha256 strings', () => {
		const into = new Set<string>();
		collectShas({ sha256: 'not-actually-a-sha' }, into);
		expect(into.size).toBe(0);
	});

	it('handles arrays + primitives + null gracefully', () => {
		const into = new Set<string>();
		collectShas([{ sha256: SHA_A }, null, 1, 'x', undefined], into);
		expect(into).toEqual(new Set([SHA_A]));
	});
});

describe('AssetGc.findReferencedShas', () => {
	let providers: Providers;
	let fs: ReturnType<typeof makeFs>;

	beforeEach(() => {
		({ providers, fs } = buildProviders());
	});

	it('returns the empty set when there is no tree/ folder', async () => {
		const gc = new AssetGc(providers);
		expect(await gc.findReferencedShas(PROJECT)).toEqual(new Set());
	});

	it('walks tree/ recursively and harvests every sha mentioned', async () => {
		fs.writeFileSync(
			`${PROJECT}/tree/_collection.json`,
			JSON.stringify({ source: { type: 'manual' } }),
		);
		fs.writeFileSync(
			`${PROJECT}/tree/users/list.json`,
			JSON.stringify({ id: 'r1', body: { type: 'file', payload: { assetRef: { sha256: SHA_A, size: 1 } } } }),
		);
		fs.writeFileSync(
			`${PROJECT}/tree/users/sub/get.json`,
			JSON.stringify({ id: 'r2', headers: { X: { value: [{ payload: { sha256: SHA_B } }] } } }),
		);

		const gc = new AssetGc(providers);
		expect(await gc.findReferencedShas(PROJECT)).toEqual(new Set([SHA_A, SHA_B]));
	});

	it('skips unreadable JSON without crashing', async () => {
		fs.writeFileSync(`${PROJECT}/tree/broken.json`, '{ this is not valid json');
		fs.writeFileSync(
			`${PROJECT}/tree/ok.json`,
			JSON.stringify({ ref: { sha256: SHA_A } }),
		);
		const gc = new AssetGc(providers);
		expect(await gc.findReferencedShas(PROJECT)).toEqual(new Set([SHA_A]));
	});
});

describe('AssetGc.findStoredShas', () => {
	let providers: Providers;
	let fs: ReturnType<typeof makeFs>;

	beforeEach(() => {
		({ providers, fs } = buildProviders());
	});

	it('lists every sha that has bytes on disk', async () => {
		fs.writeFileSync(`${PROJECT}/_assets/${SHA_A.slice(0, 2)}/${SHA_A}`, 'a');
		fs.writeFileSync(`${PROJECT}/_assets/${SHA_B.slice(0, 2)}/${SHA_B}`, 'b');
		// stray non-hex entry that should be ignored
		fs.writeFileSync(`${PROJECT}/_assets/zz/README.md`, '');

		const gc = new AssetGc(providers);
		expect(await gc.findStoredShas(PROJECT)).toEqual(new Set([SHA_A, SHA_B]));
	});

	it('returns empty when _assets/ does not exist', async () => {
		const gc = new AssetGc(providers);
		expect(await gc.findStoredShas(PROJECT)).toEqual(new Set());
	});
});

describe('AssetGc.findOrphans + delete', () => {
	let providers: Providers;
	let fs: ReturnType<typeof makeFs>;

	beforeEach(() => {
		({ providers, fs } = buildProviders());
	});

	it('reports stored shas that nothing under tree/ references', async () => {
		fs.writeFileSync(`${PROJECT}/tree/_collection.json`, JSON.stringify({ source: { type: 'manual' } }));
		fs.writeFileSync(
			`${PROJECT}/tree/keeper.json`,
			JSON.stringify({ ref: { sha256: SHA_A, size: 1 } }),
		);
		fs.writeFileSync(`${PROJECT}/_assets/${SHA_A.slice(0, 2)}/${SHA_A}`, 'keeper');
		fs.writeFileSync(`${PROJECT}/_assets/${SHA_B.slice(0, 2)}/${SHA_B}`, 'orphan-b');
		fs.writeFileSync(`${PROJECT}/_assets/${SHA_C.slice(0, 2)}/${SHA_C}`, 'orphan-c');

		const gc = new AssetGc(providers);
		const orphans = await gc.findOrphans(PROJECT);
		expect(new Set(orphans)).toEqual(new Set([SHA_B, SHA_C]));

		const removed = await gc.delete(PROJECT, orphans);
		expect(new Set(removed)).toEqual(new Set([SHA_B, SHA_C]));
		// Keeper still on disk; orphans are gone.
		expect(fs.files.has(`${PROJECT}/_assets/${SHA_A.slice(0, 2)}/${SHA_A}`)).toBe(true);
		expect(fs.files.has(`${PROJECT}/_assets/${SHA_B.slice(0, 2)}/${SHA_B}`)).toBe(false);
		expect(fs.files.has(`${PROJECT}/_assets/${SHA_C.slice(0, 2)}/${SHA_C}`)).toBe(false);
	});

	it('delete() rejects malformed shas and is idempotent on missing files', async () => {
		const gc = new AssetGc(providers);
		const removed = await gc.delete(PROJECT, ['not-a-sha', SHA_A]);
		// Malformed sha skipped; SHA_A had no file but "delete" still counts it.
		expect(removed).toEqual([SHA_A]);
	});
});
