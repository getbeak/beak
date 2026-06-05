import type { AssetRef } from '@getbeak/extension-sdk';
import { describe, expect, it, vi } from 'vitest';

import { type AssetResolveDeps, resolveAssetBytes } from '../resolve';

function makeDeps(overrides: Partial<AssetResolveDeps> = {}): AssetResolveDeps {
	return {
		readAsset: vi.fn(async () => null),
		readReferencedFile: vi.fn(async () => ({ body: new Uint8Array() })),
		...overrides,
	};
}

const ref: AssetRef = { sha256: 'abc', size: 4 };

describe('resolveAssetBytes', () => {
	it('returns asset bytes when assetRef is present and the store has the blob', async () => {
		const bytes = new Uint8Array([1, 2, 3, 4]);
		const result = await resolveAssetBytes({ assetRef: ref }, makeDeps({ readAsset: async () => ({ body: bytes }) }));
		expect(result).toEqual({ kind: 'asset', bytes, ref });
	});

	it('reports asset-not-found when assetRef points at a missing blob — does NOT silently fall back to fileReferenceId', async () => {
		const result = await resolveAssetBytes(
			{ assetRef: ref, fileReferenceId: 'fr-1' },
			makeDeps({ readAsset: async () => null }),
		);
		expect(result).toEqual({ kind: 'missing', reason: 'asset-not-found' });
	});

	it('falls back to fileReferenceId when assetRef is absent', async () => {
		const bytes = new Uint8Array([9]);
		const result = await resolveAssetBytes(
			{ fileReferenceId: 'fr-1' },
			makeDeps({ readReferencedFile: async () => ({ body: bytes }) }),
		);
		expect(result).toEqual({ kind: 'file', bytes, fileReferenceId: 'fr-1' });
	});

	it('returns no-pointers when neither path is present', async () => {
		const result = await resolveAssetBytes({}, makeDeps());
		expect(result).toEqual({ kind: 'missing', reason: 'no-pointers' });
	});

	it('captures thrown errors as a Result rather than rethrowing', async () => {
		const boom = new Error('disk on fire');
		const result = await resolveAssetBytes(
			{ fileReferenceId: 'fr-1' },
			makeDeps({
				readReferencedFile: async () => {
					throw boom;
				},
			}),
		);
		expect(result).toEqual({ kind: 'error', error: boom });
	});
});
