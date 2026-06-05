import { describe, expect, it } from 'vitest';

import type { RequestFile, RequestFileOverride } from '../../schemas/beak-project';
import { countAssetRefs, extractAssetRefs } from '../introspection';

const SHA_A = '0000000000000000000000000000000000000000000000000000000000000000';
const SHA_B = '1111111111111111111111111111111111111111111111111111111111111111';

function baseRequest(): RequestFile {
	return {
		id: 'r1',
		verb: 'GET',
		url: ['https://example.com'],
		query: {},
		headers: {},
	};
}

describe('extractAssetRefs', () => {
	it('returns an empty array when the request has no body', () => {
		expect(extractAssetRefs(baseRequest())).toEqual([]);
	});

	it('returns an empty array for non-file bodies', () => {
		expect(
			extractAssetRefs({
				...baseRequest(),
				body: { type: 'text', payload: 'hello' },
			}),
		).toEqual([]);
	});

	it('returns the assetRef when the body is a file with one', () => {
		const refs = extractAssetRefs({
			...baseRequest(),
			body: {
				type: 'file',
				payload: { assetRef: { sha256: SHA_A, size: 42, contentType: 'image/png' } },
			},
		});
		expect(refs).toEqual([{ sha256: SHA_A, size: 42, contentType: 'image/png' }]);
	});

	it('returns nothing for a legacy file body with only fileReferenceId', () => {
		expect(
			extractAssetRefs({
				...baseRequest(),
				body: { type: 'file', payload: { fileReferenceId: 'legacy' } },
			}),
		).toEqual([]);
	});

	it('rejects a malformed assetRef in the payload', () => {
		expect(
			extractAssetRefs({
				...baseRequest(),
				body: {
					type: 'file',
					// biome-ignore lint/suspicious/noExplicitAny: testing the type guard
					payload: { assetRef: { sha256: 'nope', size: 1 } } as any,
				},
			}),
		).toEqual([]);
	});

	it('works on a sparse override too', () => {
		const override: RequestFileOverride = {
			id: 'r1',
			body: { type: 'file', payload: { assetRef: { sha256: SHA_B, size: 1 } } },
		};
		const refs = extractAssetRefs(override);
		expect(refs[0]?.sha256).toBe(SHA_B);
	});
});

describe('countAssetRefs', () => {
	it('returns 0 for a text body', () => {
		expect(countAssetRefs({ ...baseRequest(), body: { type: 'text', payload: 'x' } })).toBe(0);
	});

	it('returns 1 for a file body carrying an assetRef', () => {
		expect(
			countAssetRefs({
				...baseRequest(),
				body: { type: 'file', payload: { assetRef: { sha256: SHA_A, size: 1 } } },
			}),
		).toBe(1);
	});

	it('returns 0 for a file body with no assetRef', () => {
		expect(
			countAssetRefs({
				...baseRequest(),
				body: { type: 'file', payload: { fileReferenceId: 'x' } },
			}),
		).toBe(0);
	});
});
