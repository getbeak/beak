import type { VariableSet } from '@getbeak/types/variable-sets';
import { describe, expect, it } from 'vitest';

import type { CollectionFile, RequestFile } from '../../../schemas/beak-project';
import { collectionToOpenapi } from '../exporter';
import type { OpenApiParameter, OpenApiReference } from '../types';

function isParameter(p: OpenApiParameter | OpenApiReference): p is OpenApiParameter {
	return !('$ref' in p);
}

function indexParameters(
	params: ReadonlyArray<OpenApiParameter | OpenApiReference> | undefined,
): Record<string, OpenApiParameter> {
	const out: Record<string, OpenApiParameter> = {};
	for (const p of params ?? []) {
		if (!isParameter(p)) continue;
		out[`${p.in}:${p.name}`] = p;
	}
	return out;
}

function findParameter(
	params: ReadonlyArray<OpenApiParameter | OpenApiReference> | undefined,
	predicate: (p: OpenApiParameter) => boolean,
): OpenApiParameter | undefined {
	for (const p of params ?? []) {
		if (!isParameter(p)) continue;
		if (predicate(p)) return p;
	}
	return undefined;
}

function emptyCollection(): CollectionFile {
	return {
		source: { type: 'manual' },
		defaults: { baseUrl: ['https://api.example.com'] },
	};
}

function reqGet(id: string, url: string, extra: Partial<RequestFile> = {}): RequestFile {
	return {
		id,
		verb: 'get',
		url: [url],
		body: { type: 'text', payload: '' },
		...extra,
	};
}

describe('collectionToOpenapi', () => {
	it('emits info, servers, and one operation per request', () => {
		const collection = emptyCollection();
		const requests: RequestFile[] = [
			reqGet('id-listUsers', '/users', { _provenance: { source: 'openapi', linked: true, operationId: 'listUsers' } }),
			reqGet('id-getUser', '/users/:id', {
				_provenance: { source: 'openapi', linked: true, operationId: 'getUser' },
				pathParameters: {
					id: { name: 'id', value: [''], type: 'string', required: true },
				},
			}),
		];
		const { document, warnings } = collectionToOpenapi(collection, requests, { title: 'Users API', version: '2.0.0' });

		expect(document.openapi).toBe('3.0.3');
		expect(document.info).toEqual({ title: 'Users API', version: '2.0.0' });
		expect(document.servers).toEqual([{ url: 'https://api.example.com' }]);
		expect(document.paths?.['/users']?.get?.operationId).toBe('listUsers');
		expect(document.paths?.['/users/{id}']?.get?.operationId).toBe('getUser');
		expect(warnings).toHaveLength(0);
	});

	it('rebuilds {name} placeholders from :name in the URL', () => {
		const collection = emptyCollection();
		const requests: RequestFile[] = [
			reqGet('id-x', '/widgets/:widgetId/parts/:partId', {
				_provenance: { source: 'openapi', linked: true, operationId: 'getPart' },
			}),
		];
		const { document } = collectionToOpenapi(collection, requests);
		expect(document.paths).toHaveProperty('/widgets/{widgetId}/parts/{partId}');
	});

	it('round-trips header + query constraints back onto operation.parameters', () => {
		const collection = emptyCollection();
		const requests: RequestFile[] = [
			reqGet('id-list', '/items', {
				_provenance: { source: 'openapi', linked: true, operationId: 'listItems' },
				query: {
					limit: {
						name: 'limit',
						value: ['25'],
						enabled: true,
						type: 'number',
						required: true,
						description: 'Max rows.',
						constraints: { integer: true, min: 1, max: 100 },
					},
					tier: {
						name: 'tier',
						value: ['free'],
						enabled: false,
						type: 'enum',
						options: ['free', 'pro'],
					},
				},
				headers: {
					'X-Slug': {
						name: 'X-Slug',
						value: [''],
						enabled: false,
						constraints: { pattern: '^[a-z0-9-]+$', minLength: 3, maxLength: 40 },
					},
					Authorization: {
						name: 'Authorization',
						value: [''],
						enabled: true,
						type: 'token',
						required: true,
					},
				},
			}),
		];

		const { document } = collectionToOpenapi(collection, requests);
		const op = document.paths?.['/items']?.get;
		expect(op).toBeDefined();
		const byName = indexParameters(op?.parameters);

		expect(byName['query:limit']?.required).toBe(true);
		expect(byName['query:limit']?.description).toBe('Max rows.');
		expect(byName['query:limit']?.schema).toMatchObject({ type: 'integer', minimum: 1, maximum: 100 });

		expect(byName['query:tier']?.schema).toMatchObject({ type: 'string', enum: ['free', 'pro'] });
		expect(byName['query:tier']?.required).toBeUndefined();

		expect(byName['header:X-Slug']?.schema).toMatchObject({
			pattern: '^[a-z0-9-]+$',
			minLength: 3,
			maxLength: 40,
		});

		// token → format: password
		expect(byName['header:Authorization']?.schema).toMatchObject({ type: 'string', format: 'password' });
		expect(byName['header:Authorization']?.required).toBe(true);
	});

	it('marks path parameters required and propagates their schema', () => {
		const collection = emptyCollection();
		const requests: RequestFile[] = [
			reqGet('id-u', '/users/:id', {
				pathParameters: {
					id: {
						name: 'id',
						value: [''],
						type: 'string',
						required: true,
						constraints: { format: 'uuid' },
					},
				},
			}),
		];
		const { document } = collectionToOpenapi(collection, requests);
		const op = document.paths?.['/users/{id}']?.get;
		const idParam = findParameter(op?.parameters, p => p.in === 'path' && p.name === 'id');
		expect(idParam?.required).toBe(true);
		expect(idParam?.schema?.format).toBe('uuid');
	});

	it('skips a request whose verb is not a standard HTTP method, with a warning', () => {
		const collection = emptyCollection();
		const requests: RequestFile[] = [reqGet('id-weird', '/x', { verb: 'PURGE' })];
		const { document, warnings } = collectionToOpenapi(collection, requests);
		expect(Object.keys(document.paths ?? {})).toHaveLength(0);
		expect(warnings.some(w => w.includes("verb 'PURGE'"))).toBe(true);
	});

	it('strips a shared server base path from the operation path', () => {
		const collection: CollectionFile = {
			source: { type: 'manual' },
			defaults: { baseUrl: ['https://api.example.com/v1'] },
		};
		const requests: RequestFile[] = [reqGet('id-x', '/v1/widgets', {})];
		const { document } = collectionToOpenapi(collection, requests);
		expect(document.servers).toEqual([{ url: 'https://api.example.com/v1' }]);
		expect(document.paths).toHaveProperty('/widgets');
	});

	it('emits one server per set when baseUrl references a variable-set item', () => {
		const collection: CollectionFile = {
			source: { type: 'manual' },
			defaults: {
				baseUrl: [{ type: 'variable_set_item', payload: { itemId: 'item-baseUrl' } }],
			},
		};
		const set: VariableSet = {
			sets: { 'set-prod': 'Production', 'set-stg': 'Staging' },
			items: { 'item-baseUrl': 'baseUrl' },
			values: {
				'set-prod&item-baseUrl': ['https://api.example.com'],
				'set-stg&item-baseUrl': ['https://stg.example.com'],
			},
		};
		const requests: RequestFile[] = [reqGet('id-x', '/things', {})];
		const { document } = collectionToOpenapi(collection, requests, { variableSet: set });
		expect(document.servers).toEqual(
			expect.arrayContaining([
				{ url: 'https://api.example.com', description: 'Production' },
				{ url: 'https://stg.example.com', description: 'Staging' },
			]),
		);
	});

	it('does not emit a schema block when a parameter has nothing to describe', () => {
		const collection = emptyCollection();
		const requests: RequestFile[] = [
			reqGet('id-bare', '/things', {
				query: {
					q: { name: 'q', value: [''], enabled: false },
				},
			}),
		];
		const { document } = collectionToOpenapi(collection, requests);
		const op = document.paths?.['/things']?.get;
		const q = findParameter(op?.parameters, p => p.name === 'q');
		expect(q).toBeDefined();
		expect(q?.schema).toBeUndefined();
	});
});
