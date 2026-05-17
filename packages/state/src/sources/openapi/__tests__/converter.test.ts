import { describe, expect, it } from 'vitest';
import { openapiToCollection } from '../converter';
import type { OpenApiDocument } from '../types';

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
	it('points the collection baseUrl at the proposed Environments variable set', () => {
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

		// baseUrl is now a value-part referencing the proposed variable-set
		// item; the literal URL lives inside `variableSet.set.values`.
		const baseUrl = (result.collection.defaults?.baseUrl ?? []) as unknown as Array<{
			type?: string;
			payload?: { itemId?: string };
		}>;
		expect(baseUrl[0]?.type).toBe('variable_set_item');
		expect(baseUrl[0]?.payload?.itemId).toBe(result.variableSet?.items.baseUrl);

		const values = Object.values(result.variableSet?.set.values ?? {});
		expect(values).toContainEqual(['https://api.example.com']);
	});

	it('emits one request per operation, carrying operationId and verb', () => {
		const result = openapiToCollection(minimalSpec(), { now: FIXED_NOW, makeId: STABLE_ID });
		const opIds = result.requests.map(r => r.override.operationId);
		expect(opIds).toContain('listUsers');
		expect(opIds).toContain('createUser');
		expect(opIds).toContain('getUser');

		const listUsers = result.requests.find(r => r.override.operationId === 'listUsers')!;
		expect(listUsers.override.verb).toBe('get');
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

	it('captures a JSON body example when the schema has no structure', () => {
		// Example-only schemas (no `type` / `properties` / `items` / `$ref`)
		// have nothing for the structured editor to bind to — we keep the
		// example as a text-body seed so the user still sees what's expected.
		const result = openapiToCollection(minimalSpec(), { now: FIXED_NOW, makeId: STABLE_ID });
		const createUser = result.requests.find(r => r.override.operationId === 'createUser')!;
		expect(createUser.override.body?.type).toBe('text');
		const payload = (createUser.override.body as { type: 'text'; payload: string }).payload;
		expect(payload).toContain('"name"');
		expect(payload).toContain('"Alice"');
	});

	it('converts a JSON body schema with properties into a structured json body', () => {
		const spec = minimalSpec();
		spec.paths!['/things'] = {
			post: {
				operationId: 'createThing',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['name'],
								properties: {
									name: { type: 'string', description: 'Display name' },
									count: { type: 'integer' },
								},
							},
						},
					},
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const createThing = result.requests.find(r => r.override.operationId === 'createThing')!;
		expect(createThing.override.body?.type).toBe('json');
		const payload = (createThing.override.body as { type: 'json'; payload: Record<string, { type: string; name?: string; required?: boolean; description?: string }> }).payload;
		const named = Object.values(payload).filter(e => 'name' in e && e.name !== undefined);
		const root = Object.values(payload).find(e => e.type === 'object' && !('name' in e && e.name));
		expect(root).toBeDefined();
		const byName = Object.fromEntries(named.map(e => [e.name as string, e]));
		expect(byName.name).toBeDefined();
		expect(byName.name.type).toBe('string');
		expect(byName.name.required).toBe(true);
		expect(byName.name.description).toBe('Display name');
		expect(byName.count).toBeDefined();
		// integer collapses to number — Beak doesn't have a separate integer
		// editor affordance.
		expect(byName.count.type).toBe('number');
		expect(byName.count.required).toBeUndefined();
	});

	it('falls back to responses[200] schema when the operation has no requestBody', () => {
		const spec = minimalSpec();
		spec.paths!['/widgets'] = {
			get: {
				operationId: 'listWidgets',
				responses: {
					'200': {
						description: 'OK',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										widgets: {
											type: 'array',
											items: { type: 'string' },
										},
									},
								},
							},
						},
					},
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const listWidgets = result.requests.find(r => r.override.operationId === 'listWidgets')!;
		expect(listWidgets.override.body?.type).toBe('json');
		const payload = (listWidgets.override.body as { type: 'json'; payload: Record<string, { type: string; name?: string }> }).payload;
		const widgets = Object.values(payload).find(e => 'name' in e && e.name === 'widgets');
		expect(widgets).toBeDefined();
		expect(widgets!.type).toBe('array');
	});

	it('resolves a $ref-based body schema against components.schemas', () => {
		const spec = minimalSpec();
		spec.paths!['/widgets'] = {
			post: {
				operationId: 'createWidget',
				requestBody: {
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/Widget' },
						},
					},
				},
			},
		};
		spec.components = {
			...(spec.components ?? {}),
			schemas: {
				Widget: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string' },
						colour: { type: 'string', enum: ['red', 'blue'] },
					},
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const createWidget = result.requests.find(r => r.override.operationId === 'createWidget')!;
		expect(createWidget.override.body?.type).toBe('json');
		const payload = (createWidget.override.body as { type: 'json'; payload: Record<string, { type: string; name?: string; options?: unknown[] }> }).payload;
		const colour = Object.values(payload).find(e => 'name' in e && e.name === 'colour');
		expect(colour).toBeDefined();
		expect(colour!.type).toBe('enum');
		expect(colour!.options).toEqual(['red', 'blue']);
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

	it('resolves a #/components/parameters/<name> $ref against the document', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 'r', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/r': {
					get: { operationId: 'op', parameters: [{ $ref: '#/components/parameters/Common' }] },
				},
			},
			components: {
				parameters: {
					Common: { name: 'x-trace', in: 'header', required: true, schema: { type: 'string' } },
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const op = result.requests.find(r => r.override.operationId === 'op')!;
		expect(op.override.headers?.['x-trace']).toBeDefined();
		// No warning when resolution succeeds.
		expect(result.warnings.find(w => w.includes('x-trace'))).toBeUndefined();
	});

	it('warns about an external $ref it cannot resolve', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 'r', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/r': {
					get: { operationId: 'op', parameters: [{ $ref: 'common.yaml#/parameters/Common' }] },
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		expect(result.warnings.some(w => w.includes('unsupported $ref'))).toBe(true);
	});

	it('warns about a dangling $ref (target missing from components)', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 'r', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/r': {
					get: { operationId: 'op', parameters: [{ $ref: '#/components/parameters/Missing' }] },
				},
			},
			components: { parameters: {} },
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		expect(result.warnings.some(w => w.includes('Dangling $ref'))).toBe(true);
	});

	it('uses the provided id generator for each request', () => {
		const result = openapiToCollection(minimalSpec(), {
			now: FIXED_NOW,
			makeId: (op, i) => `${op}@${i}`,
		});
		expect(result.requests[0].override.id).toBe(`${result.requests[0].override.operationId}@0`);
	});

	it('emits schema metadata (required, description, scalar type) onto headers + query', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 's', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/things': {
					get: {
						operationId: 'list',
						parameters: [
							{
								name: 'limit',
								in: 'query',
								required: true,
								description: 'Max rows returned.',
								schema: { type: 'integer', default: 25 },
							},
							{
								name: 'tier',
								in: 'query',
								schema: { type: 'string', enum: ['free', 'pro'] },
							},
							{
								name: 'active',
								in: 'query',
								schema: { type: 'boolean' },
							},
							{
								name: 'Authorization',
								in: 'header',
								required: true,
								description: 'Bearer token.',
								schema: { type: 'string' },
							},
						],
					},
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const op = result.requests.find(r => r.override.operationId === 'list')!;

		expect(op.override.query?.limit).toMatchObject({
			required: true,
			type: 'number',
			description: 'Max rows returned.',
		});
		expect(op.override.query?.tier).toMatchObject({ type: 'enum', options: ['free', 'pro'] });
		expect(op.override.query?.tier).not.toHaveProperty('required');
		expect(op.override.query?.active).toMatchObject({ type: 'boolean' });

		// Well-known auth header → token (masked in value editor).
		expect(op.override.headers?.Authorization).toMatchObject({
			required: true,
			type: 'token',
			description: 'Bearer token.',
		});
	});

	it('carries pattern / format / length / min-max constraints onto query + header entries', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 's', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/things': {
					get: {
						operationId: 'list',
						parameters: [
							{
								name: 'limit',
								in: 'query',
								schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
							},
							{
								name: 'email',
								in: 'query',
								schema: { type: 'string', format: 'email', maxLength: 254 },
							},
							{
								name: 'X-Slug',
								in: 'header',
								schema: { type: 'string', pattern: '^[a-z0-9-]+$', minLength: 3, maxLength: 40 },
							},
							// `format: 'binary'` is OpenAPI-valid but isn't in our
							// known-format set — should be dropped, not propagated.
							{
								name: 'X-Blob',
								in: 'header',
								schema: { type: 'string', format: 'binary' },
							},
						],
					},
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const op = result.requests.find(r => r.override.operationId === 'list')!;

		expect(op.override.query?.limit).toMatchObject({
			constraints: { integer: true, min: 1, max: 100 },
		});
		expect(op.override.query?.email).toMatchObject({
			constraints: { format: 'email', maxLength: 254 },
		});
		expect(op.override.headers?.['X-Slug']).toMatchObject({
			constraints: { pattern: '^[a-z0-9-]+$', minLength: 3, maxLength: 40 },
		});
		// Unknown format dropped, but no `constraints` block fabricated.
		expect(op.override.headers?.['X-Blob']).not.toHaveProperty('constraints');
	});

	it('flips headers with format: password to type: token (masking in value editor)', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 's', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/things': {
					get: {
						operationId: 'list',
						parameters: [
							// Non-credential header name + password format → still token.
							{ name: 'X-Custom-Secret', in: 'header', schema: { type: 'string', format: 'password' } },
						],
					},
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const op = result.requests.find(r => r.override.operationId === 'list')!;
		expect(op.override.headers?.['X-Custom-Secret']).toMatchObject({ type: 'token' });
	});

	it('does not emit a constraints block when the schema declares no constraints', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 's', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/things': {
					get: {
						operationId: 'list',
						parameters: [
							{ name: 'q', in: 'query', schema: { type: 'string' } },
							{ name: 'X-Trace', in: 'header', schema: { type: 'string' } },
						],
					},
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const op = result.requests.find(r => r.override.operationId === 'list')!;
		expect(op.override.query?.q).not.toHaveProperty('constraints');
		expect(op.override.headers?.['X-Trace']).not.toHaveProperty('constraints');
	});

	it('carries constraints through to path parameters too', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 's', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/users/{id}': {
					parameters: [
						{
							name: 'id',
							in: 'path',
							required: true,
							schema: { type: 'string', format: 'uuid', pattern: '^[a-f0-9-]+$' },
						},
					],
					get: { operationId: 'getUser' },
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const op = result.requests.find(r => r.override.operationId === 'getUser')!;
		expect(op.override.pathParameters?.id).toMatchObject({
			constraints: { format: 'uuid', pattern: '^[a-f0-9-]+$' },
		});
	});

	it('omits type when it would default to "string" — keeps the file diff calm', () => {
		const spec: OpenApiDocument = {
			openapi: '3.0.0',
			info: { title: 's', version: '1' },
			servers: [{ url: 'https://x' }],
			paths: {
				'/things': {
					get: {
						operationId: 'list',
						parameters: [
							{ name: 'q', in: 'query', schema: { type: 'string' } },
							{ name: 'X-Trace', in: 'header', schema: { type: 'string' } },
						],
					},
				},
			},
		};
		const result = openapiToCollection(spec, { now: FIXED_NOW, makeId: STABLE_ID });
		const op = result.requests.find(r => r.override.operationId === 'list')!;
		expect(op.override.query?.q).not.toHaveProperty('type');
		expect(op.override.headers?.['X-Trace']).not.toHaveProperty('type');
	});
});
