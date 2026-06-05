import { describe, expect, it } from 'vitest';

import type { RequestFile } from '../../schemas/beak-project';
import { checkAssetIntegrity, checkProjectIntegrity } from '../integrity';

const SHA_A = '0000000000000000000000000000000000000000000000000000000000000000';
const SHA_B = '1111111111111111111111111111111111111111111111111111111111111111';
const SHA_C = '2222222222222222222222222222222222222222222222222222222222222222';

function fileBody(sha: string, size = 4): RequestFile['body'] {
	return {
		type: 'file',
		payload: { assetRef: { sha256: sha, size } },
	};
}

function base(): RequestFile {
	return { id: 'r1', verb: 'POST', url: ['x'], query: {}, headers: {} };
}

describe('checkAssetIntegrity', () => {
	it('returns empty report for a request with no asset refs', () => {
		const out = checkAssetIntegrity({ ...base(), body: { type: 'text', payload: 'hi' } }, new Set([SHA_A]));
		expect(out.missing).toEqual([]);
		expect(out.present).toEqual([]);
	});

	it('classifies the ref as present when its sha is available', () => {
		const out = checkAssetIntegrity({ ...base(), body: fileBody(SHA_A) }, new Set([SHA_A]));
		expect(out.present).toHaveLength(1);
		expect(out.missing).toEqual([]);
	});

	it('classifies the ref as missing when its sha is absent', () => {
		const out = checkAssetIntegrity({ ...base(), body: fileBody(SHA_B) }, new Set([SHA_A]));
		expect(out.missing[0]?.sha256).toBe(SHA_B);
		expect(out.present).toEqual([]);
	});
});

describe('checkProjectIntegrity', () => {
	it('returns one report per request, keyed by id', () => {
		const out = checkProjectIntegrity(
			[
				{ id: 'r1', request: { ...base(), body: fileBody(SHA_A) } },
				{ id: 'r2', request: { ...base(), body: fileBody(SHA_B) } },
				{ id: 'r3', request: { ...base(), body: { type: 'text', payload: 'hi' } } },
			],
			new Set([SHA_A, SHA_C]),
		);
		expect(Object.keys(out)).toEqual(['r1', 'r2', 'r3']);
		expect(out.r1.present[0]?.sha256).toBe(SHA_A);
		expect(out.r2.missing[0]?.sha256).toBe(SHA_B);
		expect(out.r3.missing).toEqual([]);
		expect(out.r3.present).toEqual([]);
	});
});
