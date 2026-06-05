import type { RequestBody, RequestOverview, ToggleKeyValue } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type PrepareRequestDeps, prepareRequest } from '../prepare-request';

function makeContext(): Context {
	return {
		selectedSets: {},
		variableSets: {},
		flightHistory: {},
		projectTree: {},
		currentRequestId: 'req-1',
	};
}

function makeOverview(overrides: Partial<RequestOverview> = {}): RequestOverview {
	return {
		verb: 'POST',
		url: ['https://example.com'],
		query: {},
		headers: {},
		body: { type: 'text', payload: 'hi' },
		options: { followRedirects: true },
		...overrides,
	};
}

let idCounter: number;

function makeDeps(overrides: Partial<PrepareRequestDeps> = {}): PrepareRequestDeps {
	idCounter = 0;
	return {
		parseValueSections: vi.fn(async (_ctx, parts) =>
			parts.map((p: unknown) => (typeof p === 'string' ? p : `<${(p as { type: string }).type}>`)).join(''),
		) as PrepareRequestDeps['parseValueSections'],
		convertRequestToUrl: vi.fn(async (_ctx, overview) => new URL((overview.url[0] as string) || 'https://example.com')),
		convertToRealJson: vi.fn(async (_ctx, payload) => payload),
		convertKeyValueToString: vi.fn(async () => 'a=1&b=2'),
		readReferencedFile: vi.fn(async () => ({ body: new Uint8Array([1, 2, 3]) })),
		requestAllowsBody: vi.fn(verb => verb.toLowerCase() !== 'get'),
		requestBodyContentType: vi.fn((body: RequestBody) => {
			if (body.type === 'json' || body.type === 'graphql') return 'application/json';
			if (body.type === 'url_encoded_form') return 'application/x-www-form-urlencoded';
			return undefined;
		}),
		userAgent: 'Beak/test (linux)',
		generateId: kind => `${kind}-${++idCounter}`,
		...overrides,
	};
}

describe('prepareRequest', () => {
	beforeEach(() => {
		idCounter = 0;
	});

	it('builds the resolved URL from convertRequestToUrl', async () => {
		const deps = makeDeps({
			convertRequestToUrl: vi.fn(async () => new URL('https://other.example.com/resolved')),
		});
		const result = await prepareRequest(makeOverview(), makeContext(), deps);
		expect(result.url).toEqual(['https://other.example.com/resolved']);
	});

	it('injects a User-Agent header when missing', async () => {
		const result = await prepareRequest(makeOverview(), makeContext(), makeDeps());
		const userAgentHeader = Object.values(result.headers).find(h => h.name.toLowerCase() === 'user-agent');
		expect(userAgentHeader).toMatchObject({
			name: 'User-Agent',
			value: ['Beak/test (linux)'],
			enabled: true,
		});
	});

	it('does not duplicate User-Agent when one is already present', async () => {
		const existing: Record<string, ToggleKeyValue> = {
			'h-1': { name: 'user-agent', value: ['Custom/1.0'], enabled: true },
		};
		const overview = makeOverview({ headers: existing });
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		const userAgentHeaders = Object.values(result.headers).filter(h => h.name.toLowerCase() === 'user-agent');
		expect(userAgentHeaders).toHaveLength(1);
		expect(userAgentHeaders[0]?.value).toEqual(['Custom/1.0']);
	});

	it('injects Content-Type for body-allowing verbs when none is set', async () => {
		const overview = makeOverview({
			verb: 'POST',
			body: { type: 'json', payload: {} },
		});
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		const contentType = Object.values(result.headers).find(h => h.name.toLowerCase() === 'content-type');
		expect(contentType?.value).toEqual(['application/json']);
	});

	it('does not inject Content-Type when the verb disallows a body', async () => {
		const overview = makeOverview({ verb: 'GET', body: { type: 'json', payload: {} } });
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		const contentType = Object.values(result.headers).find(h => h.name.toLowerCase() === 'content-type');
		expect(contentType).toBeUndefined();
	});

	it('flattens header value parts through parseValueSections', async () => {
		const overview = makeOverview({
			headers: {
				'h-1': { name: 'X-Custom', value: ['hello ', { type: 'variable', payload: {} }], enabled: true },
			},
		});
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		expect(result.headers['h-1']).toMatchObject({
			name: 'X-Custom',
			value: ['hello <variable>'],
			enabled: true,
		});
	});

	it('flattens query value parts', async () => {
		const overview = makeOverview({
			query: {
				'q-1': { name: 'page', value: ['1'], enabled: true },
			},
		});
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		expect(result.query['q-1']).toMatchObject({
			name: 'page',
			value: ['1'],
			enabled: true,
		});
	});

	it('returns text body unchanged when allowed', async () => {
		const overview = makeOverview({
			verb: 'POST',
			body: { type: 'text', payload: 'plain body' },
		});
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		expect(result.body).toEqual({ type: 'text', payload: 'plain body' });
	});

	it('clears body for verbs that disallow one', async () => {
		const overview = makeOverview({
			verb: 'GET',
			body: { type: 'text', payload: 'should be dropped' },
		});
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		expect(result.body).toEqual({ type: 'text', payload: '' });
	});

	it('serializes JSON body via convertToRealJson + JSON.stringify', async () => {
		const overview = makeOverview({
			verb: 'POST',
			body: { type: 'json', payload: { a: 1 } as never },
		});
		const result = await prepareRequest(
			overview,
			makeContext(),
			makeDeps({ convertToRealJson: vi.fn(async () => ({ a: 1, b: 2 })) }),
		);
		expect(result.body).toEqual({ type: 'text', payload: '{"a":1,"b":2}' });
	});

	it('serializes url_encoded_form via convertKeyValueToString', async () => {
		const overview = makeOverview({
			verb: 'POST',
			body: { type: 'url_encoded_form', payload: {} },
		});
		const result = await prepareRequest(
			overview,
			makeContext(),
			makeDeps({ convertKeyValueToString: vi.fn(async () => 'k=v') }),
		);
		expect(result.body).toEqual({ type: 'text', payload: 'k=v' });
	});

	it('reads file body via readReferencedFile and attaches binary data', async () => {
		const overview = makeOverview({
			verb: 'POST',
			body: {
				type: 'file',
				payload: { fileReferenceId: 'file-1', contentType: 'image/png' },
			},
		});
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		expect(result.body).toMatchObject({
			type: 'file',
			payload: {
				fileReferenceId: 'file-1',
				contentType: 'image/png',
				__hacky__binaryFileData: new Uint8Array([1, 2, 3]),
			},
		});
	});

	it('falls back to empty text body when file read fails', async () => {
		const overview = makeOverview({
			verb: 'POST',
			body: {
				type: 'file',
				payload: { fileReferenceId: 'missing' },
			},
		});
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = await prepareRequest(
			overview,
			makeContext(),
			makeDeps({
				readReferencedFile: vi.fn(async () => {
					throw new Error('nope');
				}),
			}),
		);
		expect(result.body).toEqual({ type: 'text', payload: '' });
		errSpy.mockRestore();
	});

	it('prefers assetRef over fileReferenceId and reads bytes via readAsset', async () => {
		const sha = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
		const overview = makeOverview({
			verb: 'POST',
			body: {
				type: 'file',
				payload: {
					fileReferenceId: 'legacy-id',
					assetRef: { sha256: sha, size: 11, contentType: 'image/png' },
				},
			},
		});
		const readAsset = vi.fn(async () => ({ body: new Uint8Array([9, 8, 7]) }));
		const readReferencedFile = vi.fn(async () => ({ body: new Uint8Array([1, 2, 3]) }));
		const result = await prepareRequest(overview, makeContext(), makeDeps({ readAsset, readReferencedFile }));
		expect(readAsset).toHaveBeenCalledWith({ sha256: sha, size: 11, contentType: 'image/png' });
		expect(readReferencedFile).not.toHaveBeenCalled();
		expect(result.body).toMatchObject({
			type: 'file',
			payload: {
				assetRef: { sha256: sha },
				__hacky__binaryFileData: new Uint8Array([9, 8, 7]),
			},
		});
	});

	it('falls back to empty text body when the asset is missing', async () => {
		const sha = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
		const overview = makeOverview({
			verb: 'POST',
			body: {
				type: 'file',
				payload: { assetRef: { sha256: sha, size: 0 } },
			},
		});
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = await prepareRequest(overview, makeContext(), makeDeps({ readAsset: vi.fn(async () => null) }));
		expect(result.body).toEqual({ type: 'text', payload: '' });
		errSpy.mockRestore();
	});

	it('still uses fileReferenceId when only the legacy field is set', async () => {
		const overview = makeOverview({
			verb: 'POST',
			body: { type: 'file', payload: { fileReferenceId: 'legacy-only' } },
		});
		const readAsset = vi.fn();
		const result = await prepareRequest(overview, makeContext(), makeDeps({ readAsset }));
		expect(readAsset).not.toHaveBeenCalled();
		expect(result.body).toMatchObject({
			type: 'file',
			payload: { fileReferenceId: 'legacy-only', __hacky__binaryFileData: new Uint8Array([1, 2, 3]) },
		});
	});

	it('returns empty text body when file payload has neither assetRef nor fileReferenceId', async () => {
		const overview = makeOverview({
			verb: 'POST',
			body: { type: 'file', payload: {} },
		});
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		expect(result.body).toEqual({ type: 'text', payload: '' });
	});

	it('serializes graphql body as JSON containing query + variables', async () => {
		const overview = makeOverview({
			verb: 'POST',
			body: {
				type: 'graphql',
				payload: { query: '{ me { id } }', variables: { id: 1 } as never },
			},
		});
		const result = await prepareRequest(
			overview,
			makeContext(),
			makeDeps({ convertToRealJson: vi.fn(async () => ({ id: 1 })) }),
		);
		expect(result.body.type).toBe('text');
		expect(JSON.parse((result.body as { type: 'text'; payload: string }).payload)).toEqual({
			query: '{ me { id } }',
			variables: { id: 1 },
		});
	});

	it('promotes graphql query onto the URL query string for body-less verbs', async () => {
		const overview = makeOverview({
			verb: 'GET',
			body: {
				type: 'graphql',
				payload: { query: '{ ping }', variables: {} as never },
			},
		});
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		const queryParam = Object.values(result.query).find(q => q.name === 'query');
		expect(queryParam?.value).toEqual(['{ ping }']);
	});

	it('reuses an existing query slot when promoting graphql onto the URL', async () => {
		const overview = makeOverview({
			verb: 'GET',
			query: {
				existing: { name: 'query', value: ['old'], enabled: true },
			},
			body: {
				type: 'graphql',
				payload: { query: '{ new }', variables: {} as never },
			},
		});
		const result = await prepareRequest(overview, makeContext(), makeDeps());
		const queryEntries = Object.values(result.query).filter(q => q.name === 'query');
		expect(queryEntries).toHaveLength(1);
		expect(queryEntries[0]?.value).toEqual(['{ new }']);
	});
});
