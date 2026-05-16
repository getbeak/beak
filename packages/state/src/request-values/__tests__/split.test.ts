import type { RequestOverview } from '@getbeak/types/request';
import { describe, expect, it } from 'vitest';

import { mergeSchemaAndValues, splitRequestIntoSchemaAndValues } from '../split';

function fixture(body: RequestOverview['body']): RequestOverview {
	return {
		verb: 'post',
		url: ['https://api.example.com/v1/things'],
		query: {
			q1: { name: 'limit', value: ['25'], enabled: true },
			q2: { name: 'offset', value: ['0'], enabled: false },
		},
		headers: {
			h1: { name: 'Authorization', value: ['Bearer abc'], enabled: true },
			h2: { name: 'X-Trace-Id', value: ['xyz'], enabled: true },
		},
		body,
		options: { followRedirects: true },
	};
}

describe('splitRequestIntoSchemaAndValues', () => {
	it('headers and query become schema lists + value cells', () => {
		const { schema, values } = splitRequestIntoSchemaAndValues(
			fixture({ type: 'text', payload: '' }),
		);
		expect(schema.headers.map(h => h.name)).toEqual(['Authorization', 'X-Trace-Id']);
		expect(schema.query.map(q => q.name)).toEqual(['limit', 'offset']);
		expect(values.headers.h1).toMatchObject({ kind: 'string', value: ['Bearer abc'], enabled: true });
		expect(values.query.q2?.enabled).toBe(false);
	});

	it('text body round-trips', () => {
		const original = fixture({ type: 'text', payload: 'hello' });
		const { schema, values } = splitRequestIntoSchemaAndValues(original);
		const merged = mergeSchemaAndValues(
			{ verb: original.verb, url: original.url, options: original.options },
			schema,
			values,
		);
		expect(merged.body).toEqual({ type: 'text', payload: 'hello' });
	});

	it('json_raw body round-trips', () => {
		const original = fixture({ type: 'json_raw', payload: '{"x":1}' });
		const { schema, values } = splitRequestIntoSchemaAndValues(original);
		expect(schema.body.type).toBe('json_raw');
		const merged = mergeSchemaAndValues(
			{ verb: original.verb, url: original.url, options: original.options },
			schema,
			values,
		);
		expect(merged.body).toEqual({ type: 'json_raw', payload: '{"x":1}' });
	});

	it('json body splits tree shape into schema, values into store', () => {
		const original = fixture({
			type: 'json',
			payload: {
				root: { id: 'root', parentId: null, enabled: true, type: 'object' },
				name: { id: 'name', parentId: 'root', enabled: true, type: 'string', name: 'name', value: ['Mel'] },
				age: { id: 'age', parentId: 'root', enabled: true, type: 'number', name: 'age', value: ['33'] },
				admin: {
					id: 'admin',
					parentId: 'root',
					enabled: false,
					type: 'boolean',
					name: 'admin',
					value: true,
				},
				zero: { id: 'zero', parentId: 'root', enabled: true, type: 'null', name: 'zero', value: null },
			},
		});

		const { schema, values } = splitRequestIntoSchemaAndValues(original);
		expect(schema.body.type).toBe('json');
		if (schema.body.type !== 'json') throw new Error('expected json');
		expect(schema.body.properties.name).toMatchObject({ name: 'name', type: 'string', parentId: 'root' });
		expect(schema.body.properties.root).toMatchObject({ type: 'object', parentId: null });

		expect(values.body.type).toBe('json');
		if (values.body.type !== 'json') throw new Error('expected json');
		expect(values.body.values.name).toMatchObject({ kind: 'string', value: ['Mel'] });
		expect(values.body.values.admin?.enabled).toBe(false);
		// Containers carry no value cell.
		expect(values.body.values.root).toBeUndefined();

		const merged = mergeSchemaAndValues(
			{ verb: original.verb, url: original.url, options: original.options },
			schema,
			values,
		);
		expect(merged.body).toEqual(original.body);
	});

	it('url_encoded_form body round-trips', () => {
		const original = fixture({
			type: 'url_encoded_form',
			payload: {
				k1: { name: 'grant_type', value: ['password'], enabled: true },
				k2: { name: 'username', value: ['me'], enabled: true },
			},
		});
		const { schema, values } = splitRequestIntoSchemaAndValues(original);
		expect(schema.body.type).toBe('url_encoded_form');
		const merged = mergeSchemaAndValues(
			{ verb: original.verb, url: original.url, options: original.options },
			schema,
			values,
		);
		expect(merged.body).toEqual(original.body);
	});

	it('file body round-trips assetRef + contentType', () => {
		const original = fixture({
			type: 'file',
			payload: {
				contentType: 'image/png',
				assetRef: { sha256: 'a'.repeat(64), size: 1234, contentType: 'image/png' },
			},
		});
		const { schema, values } = splitRequestIntoSchemaAndValues(original);
		expect(schema.body.type).toBe('file');
		expect(values.body.type).toBe('file');

		const merged = mergeSchemaAndValues(
			{ verb: original.verb, url: original.url, options: original.options },
			schema,
			values,
		);
		expect(merged.body).toEqual(original.body);
	});

	it('graphql body round-trips query + variables tree', () => {
		const original = fixture({
			type: 'graphql',
			payload: {
				query: 'query Me { me { id } }',
				variables: {
					root: { id: 'root', parentId: null, enabled: true, type: 'object' },
					id: { id: 'id', parentId: 'root', enabled: true, type: 'string', name: 'id', value: ['42'] },
				},
			},
		});

		const { schema, values } = splitRequestIntoSchemaAndValues(original);
		expect(schema.body.type).toBe('graphql');
		if (schema.body.type !== 'graphql') throw new Error('expected graphql');
		expect(schema.body.query).toBe('query Me { me { id } }');

		const merged = mergeSchemaAndValues(
			{ verb: original.verb, url: original.url, options: original.options },
			schema,
			values,
		);
		expect(merged.body).toEqual(original.body);
	});

	it('round-trips schema metadata (type/required/description) on headers + query', () => {
		const original = fixture({ type: 'text', payload: '' });
		original.headers.h1 = {
			name: 'Authorization',
			value: ['Bearer abc'],
			enabled: true,
			type: 'token',
			required: true,
			description: 'Bearer token from auth server.',
		};
		original.query.q1 = {
			name: 'limit',
			value: ['25'],
			enabled: true,
			type: 'number',
			required: true,
			description: 'Max rows returned.',
		};

		const { schema, values } = splitRequestIntoSchemaAndValues(original);
		const authHeader = schema.headers.find(h => h.id === 'h1');
		expect(authHeader).toMatchObject({
			name: 'Authorization',
			type: 'token',
			required: true,
			description: 'Bearer token from auth server.',
		});
		const limitParam = schema.query.find(q => q.id === 'q1');
		expect(limitParam).toMatchObject({
			name: 'limit',
			type: 'number',
			required: true,
			description: 'Max rows returned.',
		});

		const merged = mergeSchemaAndValues(
			{ verb: original.verb, url: original.url, options: original.options },
			schema,
			values,
		);
		expect(merged.headers.h1).toEqual(original.headers.h1);
		expect(merged.query.q1).toEqual(original.query.q1);
	});

	it('round-trips required + description on JSON body entries', () => {
		const original = fixture({
			type: 'json',
			payload: {
				root: { id: 'root', parentId: null, enabled: true, type: 'object' },
				name: {
					id: 'name',
					parentId: 'root',
					enabled: true,
					type: 'string',
					name: 'name',
					value: ['Mel'],
					required: true,
					description: 'User-facing display name.',
				},
			},
		});
		const { schema, values } = splitRequestIntoSchemaAndValues(original);
		if (schema.body.type !== 'json') throw new Error('expected json');
		expect(schema.body.properties.name).toMatchObject({
			required: true,
			description: 'User-facing display name.',
		});

		const merged = mergeSchemaAndValues(
			{ verb: original.verb, url: original.url, options: original.options },
			schema,
			values,
		);
		expect(merged.body).toEqual(original.body);
	});

	it('absent body splits to none schema + none value', () => {
		const original: RequestOverview = {
			verb: 'get',
			url: ['https://example.com'],
			query: {},
			headers: {},
			options: { followRedirects: true },
			body: undefined as unknown as RequestOverview['body'],
		};
		const { schema, values } = splitRequestIntoSchemaAndValues(original);
		expect(schema.body.type).toBe('none');
		expect(values.body.type).toBe('none');

		const merged = mergeSchemaAndValues(
			{ verb: original.verb, url: original.url, options: original.options },
			schema,
			values,
		);
		expect(merged.body).toBeUndefined();
	});
});
