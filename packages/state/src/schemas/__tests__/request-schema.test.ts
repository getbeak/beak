import { describe, expect, it } from 'vitest';

import {
	bodySchemaSchema,
	bodyValueSchema,
	emptyProjectValuesFile,
	emptyRequestSchema,
	emptyRequestValues,
	jsonPropertySchema,
	projectValuesFileSchema,
	requestSchemaSchema,
	requestValuesSchema,
	scalarPropertySchema,
} from '..';

describe('request-schema', () => {
	it('empties parse', () => {
		expect(requestSchemaSchema.parse(emptyRequestSchema())).toMatchObject({
			headers: [],
			query: [],
			body: { type: 'none' },
		});
	});

	it('scalar property with constraints', () => {
		const parsed = scalarPropertySchema.parse({
			id: 'h1',
			name: 'Authorization',
			type: 'token',
			required: true,
			description: 'Bearer token from the auth server.',
			constraints: { pattern: '^Bearer .+' },
		});
		expect(parsed.constraints?.pattern).toBe('^Bearer .+');
		expect(parsed.required).toBe(true);
	});

	it('scalar property rejects unknown type', () => {
		expect(() =>
			scalarPropertySchema.parse({
				id: 'q1',
				name: 'limit',
				type: 'bigint',
			}),
		).toThrow();
	});

	it('json property tree node', () => {
		const node = jsonPropertySchema.parse({
			id: 'n1',
			parentId: null,
			type: 'object',
			required: true,
		});
		expect(node.type).toBe('object');
		expect(node.parentId).toBeNull();
	});

	it('body schema discriminates on type', () => {
		const json = bodySchemaSchema.parse({
			type: 'json',
			properties: {
				root: { id: 'root', parentId: null, type: 'object' },
				name: { id: 'name', parentId: 'root', type: 'string', name: 'name' },
			},
		});
		expect(json.type).toBe('json');

		const form = bodySchemaSchema.parse({
			type: 'url_encoded_form',
			fields: [{ id: 'f1', name: 'a', type: 'string' }],
		});
		expect(form.type).toBe('url_encoded_form');
	});

	it('rejects strict body schema with unknown type', () => {
		expect(() => bodySchemaSchema.parse({ type: 'multipart', fields: [] })).toThrow();
	});
});

describe('request-values', () => {
	it('empties parse', () => {
		expect(requestValuesSchema.parse(emptyRequestValues())).toMatchObject({
			headers: {},
			query: {},
			body: { type: 'none' },
		});
	});

	it('values cell carries enabled flag', () => {
		const parsed = requestValuesSchema.parse({
			headers: {
				h1: { kind: 'string', value: ['hello'], enabled: true },
			},
			query: {},
			body: { type: 'none' },
		});
		expect(parsed.headers.h1?.enabled).toBe(true);
	});

	it('body value json carries values map', () => {
		const parsed = bodyValueSchema.parse({
			type: 'json',
			values: {
				k1: { kind: 'string', value: ['hi'], enabled: true },
				k2: { kind: 'boolean', value: false, enabled: true },
			},
		});
		expect(parsed.type).toBe('json');
	});

	it('project values file shape', () => {
		const file = projectValuesFileSchema.parse(emptyProjectValuesFile());
		expect(file.version).toBe(1);
		expect(file.requests).toEqual({});
	});
});
