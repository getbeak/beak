import { describe, expect, it } from 'vitest';

import { mergeCollectionDefaults } from '../../../schemas/collection-merge';
import type { RequestFile } from '../../../schemas/beak-project';
import { openapiToCollection } from '../converter';
import { collectionToOpenapi } from '../exporter';
import type { OpenApiDocument } from '../types';

const FIXED_NOW = () => '2026-05-17T00:00:00.000Z';
const STABLE_ID = (op: string, i: number) => `id-${op}-${i}`;

function spec(): OpenApiDocument {
	return {
		openapi: '3.0.3',
		info: { title: 'RT', version: '1.0.0' },
		servers: [{ url: 'https://api.example.com' }],
		paths: {
			'/users': {
				get: {
					operationId: 'listUsers',
					parameters: [
						{
							name: 'limit',
							in: 'query',
							required: true,
							description: 'Max rows.',
							schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
						},
						{
							name: 'tier',
							in: 'query',
							schema: { type: 'string', enum: ['free', 'pro'] },
						},
						{
							name: 'X-Slug',
							in: 'header',
							schema: { type: 'string', pattern: '^[a-z0-9-]+$', minLength: 3, maxLength: 40 },
						},
						{
							name: 'Authorization',
							in: 'header',
							required: true,
							schema: { type: 'string', format: 'password' },
						},
					],
				},
			},
			'/users/{id}': {
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
				get: { operationId: 'getUser' },
			},
		},
	};
}

describe('OpenAPI round-trip: import → export → import', () => {
	it('preserves parameters + their constraints across a full round-trip', () => {
		const first = openapiToCollection(spec(), { now: FIXED_NOW, makeId: STABLE_ID });
		// Materialise concrete request files so we can pass them to the exporter.
		const requests: RequestFile[] = first.requests.map(r => mergeCollectionDefaults(first.collection.defaults, r.override));

		const exported = collectionToOpenapi(first.collection, requests).document;
		const reimported = openapiToCollection(exported, { now: FIXED_NOW, makeId: STABLE_ID });

		expect(reimported.requests).toHaveLength(first.requests.length);

		const firstByOpId = Object.fromEntries(first.requests.map(r => [r.override.operationId, r.override]));
		const reByOpId = Object.fromEntries(reimported.requests.map(r => [r.override.operationId, r.override]));

		const listUsersA = firstByOpId.listUsers;
		const listUsersB = reByOpId.listUsers;
		expect(listUsersA).toBeDefined();
		expect(listUsersB).toBeDefined();

		// Verb + URL survive.
		expect(listUsersB.verb).toBe(listUsersA.verb);
		expect(listUsersB.url).toEqual(listUsersA.url);

		// Query — name, type, required, description, options, constraints all
		// preserved (we don't compare value-fields since example defaults vary
		// between the source's `default: 25` and the re-import's default-less
		// schema).
		const qA = listUsersA.query?.limit;
		const qB = listUsersB.query?.limit;
		expect(qB?.type).toBe(qA?.type);
		expect(qB?.required).toBe(qA?.required);
		expect(qB?.description).toBe(qA?.description);
		expect(qB?.constraints).toEqual(qA?.constraints);

		const tA = listUsersA.query?.tier;
		const tB = listUsersB.query?.tier;
		expect(tB?.type).toBe(tA?.type);
		expect(tB?.options).toEqual(tA?.options);

		const slugA = listUsersA.headers?.['X-Slug'];
		const slugB = listUsersB.headers?.['X-Slug'];
		expect(slugB?.constraints).toEqual(slugA?.constraints);

		const authA = listUsersA.headers?.Authorization;
		const authB = listUsersB.headers?.Authorization;
		// Both round trips agree the header is a credential.
		expect(authA?.type).toBe('token');
		expect(authB?.type).toBe('token');
		expect(authB?.required).toBe(true);
	});

	it('preserves the path parameter id + format across the round trip', () => {
		const first = openapiToCollection(spec(), { now: FIXED_NOW, makeId: STABLE_ID });
		const requests: RequestFile[] = first.requests.map(r => mergeCollectionDefaults(first.collection.defaults, r.override));
		const exported = collectionToOpenapi(first.collection, requests).document;
		const reimported = openapiToCollection(exported, { now: FIXED_NOW, makeId: STABLE_ID });

		const getUserA = first.requests.find(r => r.override.operationId === 'getUser')!.override;
		const getUserB = reimported.requests.find(r => r.override.operationId === 'getUser')!.override;

		expect(getUserB.url).toEqual(getUserA.url);
		expect(getUserB.pathParameters?.id?.constraints).toEqual(getUserA.pathParameters?.id?.constraints);
		expect(getUserB.pathParameters?.id?.required).toBe(true);
	});
});
