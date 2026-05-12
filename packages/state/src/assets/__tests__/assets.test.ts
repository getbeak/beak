import { describe, expect, it } from 'vitest';

import {
	type AssetRef,
	assetDirname,
	assetRefForBuffer,
	assetRefSchema,
	describeAsset,
	relativeAssetPath,
	sha256Hex,
} from '..';

describe('sha256Hex', () => {
	it('matches the canonical sha256 of "hello world"', async () => {
		const digest = await sha256Hex(new TextEncoder().encode('hello world'));
		expect(digest).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
	});

	it('matches the canonical sha256 of the empty buffer', async () => {
		const digest = await sha256Hex(new Uint8Array(0));
		expect(digest).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
	});
});

describe('assetRefForBuffer', () => {
	it('produces a ref with the right sha256 and size', async () => {
		const bytes = new TextEncoder().encode('hello world');
		const ref = await assetRefForBuffer(bytes, 'text/plain');
		expect(ref.sha256).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
		expect(ref.size).toBe(11);
		expect(ref.contentType).toBe('text/plain');
	});

	it('omits contentType when not provided', async () => {
		const ref = await assetRefForBuffer(new TextEncoder().encode('x'));
		expect(ref.contentType).toBeUndefined();
	});

	it('produces stable refs for identical bytes (content-addressed)', async () => {
		const a = await assetRefForBuffer(new TextEncoder().encode('same'));
		const b = await assetRefForBuffer(new TextEncoder().encode('same'));
		expect(a.sha256).toBe(b.sha256);
	});
});

describe('assetRefSchema', () => {
	it('rejects a malformed sha256', () => {
		const r = assetRefSchema.safeParse({ sha256: 'ZZZ', size: 0 });
		expect(r.success).toBe(false);
	});

	it('rejects negative size', () => {
		const ref: AssetRef = {
			sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
			size: -1,
		};
		expect(assetRefSchema.safeParse(ref).success).toBe(false);
	});

	it('accepts a well-formed ref', () => {
		const ref: AssetRef = {
			sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
			size: 0,
		};
		expect(assetRefSchema.safeParse(ref).success).toBe(true);
	});
});

describe('paths', () => {
	const ref: AssetRef = {
		sha256: 'ab12cd34ef56789012345678901234567890123456789012345678901234abcd',
		size: 1234,
	};

	it('shards the directory by the first two hex chars', () => {
		expect(assetDirname(ref.sha256)).toBe('ab');
	});

	it('builds a project-relative asset path', () => {
		expect(relativeAssetPath(ref)).toBe('_assets/ab/ab12cd34ef56789012345678901234567890123456789012345678901234abcd');
	});

	it('formats a human-readable asset description', () => {
		expect(describeAsset(ref)).toBe('sha256:ab12…abcd (1.2 KB)');
	});

	it('formats byte ranges sensibly', () => {
		const small = describeAsset({ ...ref, size: 12 });
		const mb = describeAsset({ ...ref, size: 5 * 1024 * 1024 });
		const gb = describeAsset({ ...ref, size: 3 * 1024 * 1024 * 1024 });
		expect(small).toContain('12 B');
		expect(mb).toContain('5.0 MB');
		expect(gb).toContain('3.00 GB');
	});
});
