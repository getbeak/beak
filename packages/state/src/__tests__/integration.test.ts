import { describe, expect, it } from 'vitest';

import { diffFromDefaults, mergeCollectionDefaults } from '../schemas';
import { openapiToCollection } from '../sources/openapi';
import type { OpenApiDocument } from '../sources/openapi/types';

/**
 * Cross-module integration tests. These exercise multiple of the new
 * subsystems together so we catch regressions where two pieces drift
 * apart even when their individual unit tests still pass.
 */

const FIXED_NOW = () => '2026-05-13T00:00:00.000Z';
const STABLE_ID = (op: string) => `id-${op}`;

function petstoreSpec(): OpenApiDocument {
	return {
		openapi: '3.0.0',
		info: { title: 'Pet Store', version: '1.0.0' },
		servers: [{ url: 'https://api.example.com/v1' }],
		paths: {
			'/pets': {
				parameters: [{ $ref: '#/components/parameters/Trace' }],
				get: {
					operationId: 'listPets',
					parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } }],
				},
				post: {
					operationId: 'createPet',
					requestBody: {
						content: { 'application/json': { schema: { example: { name: 'fido' } } } },
					},
				},
			},
			'/pets/{id}': {
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
				get: { operationId: 'getPet' },
			},
		},
		components: {
			parameters: {
				Trace: { name: 'X-Trace', in: 'header', required: true, schema: { type: 'string' } },
			},
		},
	};
}

describe('OpenAPI → collection → merge round trip', () => {
	it('preserves baseUrl + per-op fields when reading a sparse override back', () => {
		const { collection, requests } = openapiToCollection(petstoreSpec(), {
			now: FIXED_NOW,
			makeId: STABLE_ID,
		});

		// Every operation should resolve back to a concrete request whose URL
		// inherits the spec's `servers[0].url` and whose verb matches the spec.
		for (const r of requests) {
			const merged = mergeCollectionDefaults(collection.defaults, r.override);
			expect(merged.id).toBe(r.override.id);
			expect(merged.verb).toBe(r.override.verb);
			// The override carries the path-portion of the URL; the collection
			// baseUrl is inherited when no override URL is set. The converter
			// writes both today, so the override URL wins — but the baseUrl is
			// preserved in the collection for editing.
			expect(merged.url).toEqual(r.override.url);
		}

		// baseUrl is a value-part reference into the proposed Environments
		// variable set; the literal lives in the set's values map.
		const baseUrl = (collection.defaults?.baseUrl ?? []) as unknown as Array<{ type?: string }>;
		expect(baseUrl[0]?.type).toBe('variable_set_item');
	});

	it('resolves the shared $ref Trace header into every operation', () => {
		const { collection, requests } = openapiToCollection(petstoreSpec(), {
			now: FIXED_NOW,
			makeId: STABLE_ID,
		});

		// $ref-resolved parameters come from path-item-level `parameters`, so
		// they apply to every method under that path. listPets / createPet
		// both inherit `X-Trace`. getPet under `/pets/{id}` does not.
		const listPets = requests.find(r => r.override.operationId === 'listPets')!;
		const createPet = requests.find(r => r.override.operationId === 'createPet')!;
		const getPet = requests.find(r => r.override.operationId === 'getPet')!;

		expect(listPets.override.headers?.['X-Trace']).toBeDefined();
		expect(createPet.override.headers?.['X-Trace']).toBeDefined();
		expect(getPet.override.headers?.['X-Trace']).toBeUndefined();

		// Sanity: the collection itself, when merged into each request, gives
		// us a final shape where the path operation's headers are still there.
		const merged = mergeCollectionDefaults(collection.defaults, listPets.override);
		expect(merged.headers?.['X-Trace']?.enabled).toBe(true);
	});

	it('round-trips: read → edit verb → diff back to a sparse override', () => {
		const { collection, requests } = openapiToCollection(petstoreSpec(), {
			now: FIXED_NOW,
			makeId: STABLE_ID,
		});

		const listPets = requests.find(r => r.override.operationId === 'listPets')!;
		const concrete = mergeCollectionDefaults(collection.defaults, listPets.override);

		// User edits verb in the renderer.
		const edited = { ...concrete, verb: 'POST' };

		// Writer diffs against defaults → sparse override stored.
		const sparse = diffFromDefaults(collection.defaults, edited);
		expect(sparse.verb).toBe('POST'); // changed → present
		// id passes through; operationId stays as the converter set it.
		expect(sparse.id).toBe(listPets.override.id);

		// Read back: merge defaults → user sees the edited request.
		const reread = mergeCollectionDefaults(collection.defaults, sparse);
		expect(reread.verb).toBe('POST');
		expect(reread.url).toEqual(listPets.override.url);
	});
});
