import { describe, expect, it } from 'vitest';

import type { OpenApiDocument } from '../types';
import { openapiToCollection } from '../converter';

const FIXED_NOW = () => '2026-05-13T00:00:00.000Z';
const STABLE_ID = (op: string, i: number) => `id-${op}-${i}`;

function minimalSpec(): OpenApiDocument {
	return {
		openapi: '3.0.3',
		info: { title: 'Test', version: '1.0.0' },
		servers: [{ url: 'https://api.example.com' }],
		paths: {
			'/users': {
				get: {
					operationId: 'listUsers',
					parameters: [
						{ name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } },
						{ name: 'X-Trace', in: 'header', required: true, schema: { type: 'string' } },
					],
				},
				post: {
					operationId: 'createUser',
					requestBody: {
						content: { 'application/json': { schema: { example: { name: 'Alice' } } } },
					},
				},
			},
			'/users/{id}': {
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
				get: { operationId: 'getUser' },
				delete: {},
			},
		},
	};
}

describe('openapiToCollection', () => {
	it('produces an openapi-source collection with the first servers[] entry as baseUrl', () => {
		const result = openapiToCollection(minimalSpec(), {
			specPath: 'spec.yaml',
			now: FIXED_NOW,
			makeId: STABLE_ID,
		});
		expect(result.collection.source).toEqual({
			type: 'openapi',
			specPath: 'spec.yaml',
			lastSyncedAt: '2026-05-13T00:00:00.000Z',
		});
		expect(result.collection.defaults?.baseUrl).toEqual(['https://api.example.com']);
	});

	it('emits one request per operation, carrying operationId and verb', () => {
		const result = openapiToCollection(minimalSpec(), { now: FIXED_NOW, makeId: STABLE_ID });
		const opIds = result.requests.map(r => r.override.operationId);
		expect(opIds).toContain('listUsers');
		expect(opIds).toContain('createUser');
		expect(opIds).toContain('getUser');

		const listUsers = result.requests.find(r => r.override.operationId === 'listUsers')!;
		expect(listUsers.override.verb).toBe('GET');
		expect(listUsers.override.url).toEqual(['/users']);
		expect(listUsers.override.query?.limit).toMatchObject({
			name: 'limit',
			value: ['25'],
			enabled: false,
		});
		expect(listUsers.override.headers?.['X-Trace']).toMatchObject({
			name: 'X-Trace',
			enabled: true,
		});
	});

	it('renders path parameters as :param placeholders', () => {
		const result = openapiToCollection(minimalSpec(), { now: FIXED_NOW, makeId: STABLE_ID });
		const getUser = result.requests.find(r => r.override.operationId === 'getUser')!;
		expect(getUser.override.url).toEqual(['/users/:id']);
	});

	it('falls back to verb-path operationId and warns when none is declared', () => {
		const result = openapiToCollection(minimalSpec(), { now: FIXED_NOW, makeId: STABLE_ID });
		const fallback = result.requests.find(r => r.override.operationId === 'delete-users-id');
		expect(fallback).toBeDefined();
		expect(result.warnings.some(w => w.includes('No operationId'))).toBe(true);
	});

	it('captures a JSON body example when present', () => {
		const result = openapiToCollection(minimalSpec(), { now: FIXED_NOW, makeId: STABLE_ID });
		const createUser = result.requests.find(r => r.override.operationId === 'createUser')!;
		expect(createUser.override.body?.type).toBe('text');
		const payload = (createUser.override.body as { type: 'text'; payload: string }).payload;
		expect(payload).toContain('"name"');
		expect(payload).toContain('"Alice"');
	});

	it('warns and produces an empty baseUrl when the spec has no servers', () => {
		const spec = minimalSpec();
		spec.servers = undefined;
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		expect(result.collection.defaults?.baseUrl).toBeUndefined();
		expect(result.warnings.some(w => w.includes('no `servers`'))).toBe(true);
	});

	it('warns when the spec is not OpenAPI 3.x', () => {
		const spec = minimalSpec();
		spec.openapi = '2.0';
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		expect(result.warnings.some(w => w.includes('Unsupported OpenAPI version'))).toBe(true);
	});

	it('warns and falls through when a parameter is a $ref (not yet resolved)', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 'r', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/r': {
					get: { operationId: 'op', parameters: [{ $ref: '#/components/parameters/Common' }] },
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		expect(result.warnings.some(w => w.includes('$ref parameter'))).toBe(true);
	});

	it('uses the provided id generator for each request', () => {
		const result = openapiToCollection(minimalSpec(), {
			now: FIXED_NOW,
			makeId: (op, i) => `${op}@${i}`,
		});
		expect(result.requests[0].override.id).toBe(`${result.requests[0].override.operationId}@0`);
	});
});
