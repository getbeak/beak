import { describe, expect, it } from 'vitest';

import {
	diffFromDefaults,
	mergeCollectionDefaults,
	type RequestFile,
	type RequestFileOverride,
	requestFileSchema,
} from '..';

const SHA = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('requestFileSchema — file body shapes', () => {
	const base = {
		id: 'r1',
		verb: 'POST',
		url: ['https://api.example.com/upload'],
		query: {},
		headers: {},
	};

	it('accepts a legacy file body with only fileReferenceId', () => {
		const r = requestFileSchema.safeParse({
			...base,
			body: { type: 'file', payload: { fileReferenceId: 'legacy-ref' } },
		});
		expect(r.success).toBe(true);
	});

	it('accepts a file body with an assetRef', () => {
		const r = requestFileSchema.safeParse({
			...base,
			body: {
				type: 'file',
				payload: {
					assetRef: { sha256: SHA, size: 42, contentType: 'image/png' },
				},
			},
		});
		expect(r.success).toBe(true);
	});

	it('rejects an assetRef whose sha256 is not 64-char hex', () => {
		const r = requestFileSchema.safeParse({
			...base,
			body: { type: 'file', payload: { assetRef: { sha256: 'nope', size: 0 } } },
		});
		expect(r.success).toBe(false);
	});

	it('rejects an assetRef with negative size', () => {
		const r = requestFileSchema.safeParse({
			...base,
			body: { type: 'file', payload: { assetRef: { sha256: SHA, size: -1 } } },
		});
		expect(r.success).toBe(false);
	});
});

describe('mergeCollectionDefaults — file body with AssetRef', () => {
	it('preserves an assetRef on the override through the merge', () => {
		const override: RequestFileOverride = {
			id: 'r1',
			verb: 'POST',
			url: ['/upload'],
			body: {
				type: 'file',
				payload: { assetRef: { sha256: SHA, size: 100, contentType: 'image/png' } },
			},
		};
		const merged = mergeCollectionDefaults(undefined, override);
		expect(merged.body?.type).toBe('file');
		if (merged.body?.type === 'file') {
			expect(merged.body.payload.assetRef?.sha256).toBe(SHA);
		}
	});

	it('round-trips a file body with assetRef through merge → diff', () => {
		const defaults = { baseUrl: ['https://api.example.com'] };
		const concrete: RequestFile = mergeCollectionDefaults(defaults, {
			id: 'r1',
			verb: 'POST',
			url: ['/upload'],
			body: {
				type: 'file',
				payload: { assetRef: { sha256: SHA, size: 100 } },
			},
		});
		const sparse = diffFromDefaults(defaults, concrete);
		expect(sparse.body?.type).toBe('file');
		if (sparse.body?.type === 'file') {
			expect(sparse.body.payload.assetRef?.sha256).toBe(SHA);
		}
		// And re-merging produces the same concrete shape.
		const remerged = mergeCollectionDefaults(defaults, sparse);
		expect(remerged.body).toEqual(concrete.body);
	});
});
