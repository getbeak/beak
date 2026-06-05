import { describe, expect, it } from 'vitest';

import { JsonSchemaParseError, parseAndConvert } from '../converter';

function entries(result: ReturnType<typeof parseAndConvert>) {
	return Object.values(result.entries);
}

describe('parseAndConvert', () => {
	it('throws on non-JSON input', () => {
		expect(() => parseAndConvert('{ not json')).toThrow(JsonSchemaParseError);
	});

	it('seeds an object root with named string properties', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				properties: {
					id: { type: 'string' },
					createdAt: { type: 'string' },
				},
				required: ['id'],
			}),
		);

		const all = entries(result);
		const root = all.find(e => e.parentId === null);
		expect(root?.type).toBe('object');

		const id = all.find(e => 'name' in e && e.name === 'id');
		const createdAt = all.find(e => 'name' in e && e.name === 'createdAt');
		expect(id?.type).toBe('string');
		expect(id?.required).toBe(true);
		expect(createdAt?.type).toBe('string');
		expect(createdAt?.required).toBeUndefined();
	});

	it('maps number / integer / boolean / null to the right Beak types', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				properties: {
					a: { type: 'number' },
					b: { type: 'integer' },
					c: { type: 'boolean' },
					d: { type: 'null' },
				},
			}),
		);
		const byName = (n: string) => entries(result).find(e => 'name' in e && e.name === n)!;
		expect(byName('a').type).toBe('number');
		expect(byName('b').type).toBe('number');
		expect(byName('c').type).toBe('boolean');
		expect(byName('d').type).toBe('null');
	});

	it('treats an enum field as an enum entry with options', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				properties: {
					plan: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
				},
			}),
		);
		const plan = entries(result).find(e => 'name' in e && e.name === 'plan');
		expect(plan?.type).toBe('enum');
		expect((plan as { options?: string[] }).options).toEqual(['free', 'pro', 'enterprise']);
	});

	it('seeds a single child template for arrays', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				properties: {
					tags: { type: 'array', items: { type: 'string' } },
				},
			}),
		);
		const tags = entries(result).find(e => 'name' in e && e.name === 'tags');
		expect(tags?.type).toBe('array');

		const tagChildren = entries(result).filter(e => e.parentId === tags?.id);
		expect(tagChildren).toHaveLength(1);
		expect(tagChildren[0].type).toBe('string');
	});

	it('uses the first non-null type from a union', () => {
		const result = parseAndConvert(JSON.stringify({ type: ['null', 'string'] }));
		expect(entries(result)[0].type).toBe('string');
	});

	it('carries description onto seeded entries', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				properties: { id: { type: 'string', description: 'Stable record id' } },
			}),
		);
		const id = entries(result).find(e => 'name' in e && e.name === 'id');
		expect(id?.description).toBe('Stable record id');
	});

	it('uses `default` to seed a primitive value', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				properties: { kind: { type: 'string', default: 'user' } },
			}),
		);
		const kind = entries(result).find(e => 'name' in e && e.name === 'kind');
		expect((kind as { value: unknown[] }).value).toEqual(['user']);
	});

	it('resolves a local $ref via #/definitions', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				properties: { owner: { $ref: '#/definitions/User' } },
				definitions: {
					User: { type: 'object', properties: { id: { type: 'string' } } },
				},
			}),
		);
		const owner = entries(result).find(e => 'name' in e && e.name === 'owner');
		expect(owner?.type).toBe('object');
		const id = entries(result).find(e => 'name' in e && e.name === 'id' && e.parentId === owner?.id);
		expect(id?.type).toBe('string');
	});

	it('resolves a local $ref via OpenAPI #/components/schemas', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				properties: { owner: { $ref: '#/components/schemas/User' } },
				components: { schemas: { User: { type: 'string' } } },
			}),
		);
		const owner = entries(result).find(e => 'name' in e && e.name === 'owner');
		expect(owner?.type).toBe('string');
	});

	it('warns on unresolvable $ref and falls back to string', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				properties: { x: { $ref: 'https://example.com/schema.json' } },
			}),
		);
		expect(result.warnings.some(w => w.includes('$ref'))).toBe(true);
		const x = entries(result).find(e => 'name' in e && e.name === 'x');
		expect(x?.type).toBe('string');
	});

	it('allows primitive roots', () => {
		const result = parseAndConvert(JSON.stringify({ type: 'string', default: 'hello' }));
		const all = entries(result);
		expect(all).toHaveLength(1);
		expect(all[0].type).toBe('string');
		expect((all[0] as { value: unknown[] }).value).toEqual(['hello']);
	});

	it('carries `required` from the parent object onto child entries', () => {
		const result = parseAndConvert(
			JSON.stringify({
				type: 'object',
				required: ['a', 'c'],
				properties: {
					a: { type: 'string' },
					b: { type: 'string' },
					c: { type: 'string' },
				},
			}),
		);
		const byName = (n: string) => entries(result).find(e => 'name' in e && e.name === n)!;
		expect(byName('a').required).toBe(true);
		expect(byName('b').required).toBeUndefined();
		expect(byName('c').required).toBe(true);
	});
});
