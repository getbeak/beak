import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import AssetStore from '..';
import type { Providers } from '../../base';

// A tiny in-memory fs that satisfies the parts of node:fs we use here:
// promises.{mkdir, writeFile, readFile, stat, rm}. Behavior is intentionally
// minimal — we exercise the store, not a full POSIX surface.
function createMemoryFs() {
	const files = new Map<string, Uint8Array>();

	return {
		files,
		promises: {
			mkdir: async (_dir: string, _opts?: unknown) => {
				/* no-op: memory fs has no real directories */
			},
			writeFile: async (filePath: string, data: Uint8Array | string) => {
				const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
				files.set(filePath, bytes);
			},
			readFile: async (filePath: string) => {
				const v = files.get(filePath);
				if (!v) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
				return v;
			},
			stat: async (filePath: string) => {
				if (!files.has(filePath)) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
				return { size: files.get(filePath)!.byteLength };
			},
			rm: async (filePath: string, _opts?: unknown) => {
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
			// biome-ignore lint/suspicious/noExplicitAny: memory fs is structurally close enough for our methods
			fs: fs as any,
			// biome-ignore lint/suspicious/noExplicitAny: see above
			path: path as any,
		},
	} as Providers;
	return { providers, fs };
}

const PROJECT = '/proj';
const HELLO = new TextEncoder().encode('hello world');
const HELLO_SHA256 = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

describe('AssetStore.write', () => {
	let providers: Providers;
	let fs: ReturnType<typeof createMemoryFs>;

	beforeEach(() => {
		({ providers, fs } = buildProviders());
	});

	it('writes the bytes and returns an AssetRef carrying the sha256 + size', async () => {
		const store = new AssetStore(providers);
		const ref = await store.write(PROJECT, HELLO, 'text/plain');
		expect(ref.sha256).toBe(HELLO_SHA256);
		expect(ref.size).toBe(HELLO.byteLength);
		expect(ref.contentType).toBe('text/plain');
		// File landed under the sharded asset path.
		const expected = path.join(PROJECT, '_assets', 'b9', HELLO_SHA256);
		expect(fs.files.has(expected)).toBe(true);
	});

	it('is idempotent — writing identical bytes twice does not re-write', async () => {
		const store = new AssetStore(providers);
		const first = await store.write(PROJECT, HELLO);
		const target = path.join(PROJECT, '_assets', 'b9', first.sha256);
		const original = fs.files.get(target);
		await store.write(PROJECT, HELLO);
		// The bytes object is the same reference — we did not re-encode.
		expect(fs.files.get(target)).toBe(original);
	});

	it('omits contentType when none is provided', async () => {
		const store = new AssetStore(providers);
		const ref = await store.write(PROJECT, HELLO);
		expect(ref.contentType).toBeUndefined();
	});
});

describe('AssetStore.read / exists / delete', () => {
	let providers: Providers;

	beforeEach(() => {
		({ providers } = buildProviders());
	});

	it('round-trips bytes through write → read', async () => {
		const store = new AssetStore(providers);
		const ref = await store.write(PROJECT, HELLO);
		const out = await store.read(PROJECT, ref);
		expect(out).not.toBeNull();
		expect(new TextDecoder().decode(out!)).toBe('hello world');
	});

	it('returns null for a missing asset (does not throw)', async () => {
		const store = new AssetStore(providers);
		const out = await store.read(PROJECT, { sha256: '0'.repeat(64), size: 0 });
		expect(out).toBeNull();
	});

	it('exists() reports both directions', async () => {
		const store = new AssetStore(providers);
		const ref = await store.write(PROJECT, HELLO);
		expect(await store.exists(PROJECT, ref)).toBe(true);
		expect(await store.exists(PROJECT, { sha256: '0'.repeat(64), size: 0 })).toBe(false);
	});

	it('delete() removes the asset; subsequent reads return null', async () => {
		const store = new AssetStore(providers);
		const ref = await store.write(PROJECT, HELLO);
		await store.delete(PROJECT, ref);
		expect(await store.exists(PROJECT, ref)).toBe(false);
		expect(await store.read(PROJECT, ref)).toBeNull();
	});

	it('delete() is forgiving — missing assets do not throw', async () => {
		const store = new AssetStore(providers);
		await expect(
			store.delete(PROJECT, { sha256: '0'.repeat(64), size: 0 }),
		).resolves.toBeUndefined();
	});
});
