import { describe, expect, it } from 'vitest';

import {
	type CollectionDefaults,
	collectionFileSchema,
	diffFromDefaults,
	mergeCollectionDefaults,
	type RequestFile,
	type RequestFileOverride,
	requestFileOverrideSchema,
} from '..';

describe('collectionFileSchema', () => {
	it('accepts a manual collection with no defaults', () => {
		const r = collectionFileSchema.safeParse({ source: { type: 'manual' } });
		expect(r.success).toBe(true);
	});

	it('accepts an openapi collection with a spec path', () => {
		const r = collectionFileSchema.safeParse({
			source: { type: 'openapi', specPath: 'spec.yaml' },
			defaults: { baseUrl: ['https://api.example.com'] },
		});
		expect(r.success).toBe(true);
	});

	it('rejects an openapi collection without specPath or specUrl', () => {
		const r = collectionFileSchema.safeParse({
			source: { type: 'openapi' },
		});
		expect(r.success).toBe(false);
	});

	it('accepts a graphql collection', () => {
		const r = collectionFileSchema.safeParse({
			source: { type: 'graphql', endpoint: 'https://example.com/graphql' },
		});
		expect(r.success).toBe(true);
	});

	it('rejects an unknown source type', () => {
		const r = collectionFileSchema.safeParse({ source: { type: 'soap' } });
		expect(r.success).toBe(false);
	});
});

describe('requestFileOverrideSchema', () => {
	it('accepts a tiny override that only carries an id', () => {
		const r = requestFileOverrideSchema.safeParse({ id: 'r1' });
		expect(r.success).toBe(true);
	});

	it('accepts an override carrying operationId for sync provenance', () => {
		const r = requestFileOverrideSchema.safeParse({
			id: 'r1',
			operationId: 'listUsers',
			headers: { 'X-Foo': { name: 'X-Foo', value: ['bar'], enabled: true } },
		});
		expect(r.success).toBe(true);
	});

	it('rejects an override missing id', () => {
		const r = requestFileOverrideSchema.safeParse({ verb: 'POST' });
		expect(r.success).toBe(false);
	});
});

describe('mergeCollectionDefaults', () => {
	const defaults: CollectionDefaults = {
		verb: 'GET',
		baseUrl: ['https://api.example.com'],
		headers: {
			'X-Auth': { name: 'X-Auth', value: ['token'], enabled: true },
			Accept: { name: 'Accept', value: ['application/json'], enabled: true },
		},
		options: { followRedirects: true },
	};

	it('inherits baseUrl, verb, headers, options from defaults', () => {
		const out = mergeCollectionDefaults(defaults, { id: 'r1' });
		expect(out.url).toEqual(['https://api.example.com']);
		expect(out.verb).toBe('GET');
		expect(out.headers.Accept?.value).toEqual(['application/json']);
		expect(out.options?.followRedirects).toBe(true);
	});

	it('overrides single header without restating the others', () => {
		const out = mergeCollectionDefaults(defaults, {
			id: 'r1',
			headers: { 'X-Auth': { name: 'X-Auth', value: ['custom'], enabled: true } },
		});
		expect(out.headers['X-Auth']?.value).toEqual(['custom']);
		expect(out.headers.Accept?.value).toEqual(['application/json']);
	});

	it('keeps override-explicit verb / url over defaults', () => {
		const out = mergeCollectionDefaults(defaults, {
			id: 'r1',
			verb: 'POST',
			url: ['https://override.example.com/x'],
		});
		expect(out.verb).toBe('POST');
		expect(out.url).toEqual(['https://override.example.com/x']);
	});

	it('falls back to GET / [""] when neither defaults nor override declare them', () => {
		const out = mergeCollectionDefaults(undefined, { id: 'r1' });
		expect(out.verb).toBe('GET');
		expect(out.url).toEqual(['']);
	});

	it('preserves operationId in the merged result', () => {
		const out = mergeCollectionDefaults(defaults, { id: 'r1', operationId: 'listUsers' });
		expect((out as RequestFile & { operationId?: string }).operationId).toBe('listUsers');
	});
});

describe('diffFromDefaults', () => {
	const defaults: CollectionDefaults = {
		verb: 'GET',
		baseUrl: ['https://api.example.com'],
		headers: {
			Accept: { name: 'Accept', value: ['application/json'], enabled: true },
		},
	};

	it('strips fields that equal the defaults', () => {
		const concrete: RequestFile = mergeCollectionDefaults(defaults, { id: 'r1' });
		const override = diffFromDefaults(defaults, concrete);
		expect(override).toEqual({ id: 'r1' });
	});

	it('keeps fields that differ from the defaults', () => {
		const concrete: RequestFile = mergeCollectionDefaults(defaults, { id: 'r1', verb: 'POST' });
		const override = diffFromDefaults(defaults, concrete);
		expect(override.verb).toBe('POST');
		expect(override.url).toBeUndefined();
	});

	it('round-trips: merge(diff(x), defaults) reproduces x', () => {
		const concrete: RequestFile = {
			id: 'r1',
			verb: 'PUT',
			url: ['https://api.example.com/users/1'],
			query: { id: { name: 'id', value: ['1'], enabled: true } },
			headers: {
				Accept: { name: 'Accept', value: ['application/json'], enabled: true },
				'X-Auth': { name: 'X-Auth', value: ['token'], enabled: true },
			},
			options: { followRedirects: false },
		};
		const override = diffFromDefaults(defaults, concrete);
		const merged = mergeCollectionDefaults(defaults, override);
		expect(merged.verb).toBe(concrete.verb);
		expect(merged.url).toEqual(concrete.url);
		expect(merged.query).toEqual(concrete.query);
		expect(merged.headers).toEqual(concrete.headers);
		expect(merged.options).toEqual(concrete.options);
	});

	it('writes operationId through the diff', () => {
		const concrete: RequestFile & { operationId?: string } = {
			id: 'r1',
			verb: 'GET',
			url: ['https://api.example.com'],
			query: {},
			headers: { Accept: { name: 'Accept', value: ['application/json'], enabled: true } },
			operationId: 'listUsers',
		};
		const override = diffFromDefaults(defaults, concrete);
		expect(override.operationId).toBe('listUsers');
	});
});
