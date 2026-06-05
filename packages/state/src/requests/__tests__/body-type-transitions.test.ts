import type { Context } from '@getbeak/types/values';
import { describe, expect, it } from 'vitest';

import { type BodyTransitionDeps, createEmptyBody, transitionBody } from '../body-type-transitions';

const ctx: Context = {
	selectedSets: {},
	variableSets: {},
	flightHistory: {},
	projectTree: {},
};

function makeDeps(overrides: Partial<BodyTransitionDeps> = {}): BodyTransitionDeps {
	let counter = 0;
	return {
		convertToRealJson: async () => ({ stub: true }),
		convertKeyValueToString: async () => 'k=v',
		generateEntryId: () => `id-${++counter}`,
		textToEntryJson: text =>
			({ root: { id: 'root', parentId: null, enabled: true, type: 'object' }, _seed: text }) as never,
		textToUrlEncodedForm: () => ({ urlencodeditem: { name: 'k', value: ['v'], enabled: true } }),
		...overrides,
	};
}

describe('transitionBody — no-ops', () => {
	it('returns the input when oldType === newType', async () => {
		const body = { type: 'text' as const, payload: 'hi' };
		const result = await transitionBody(body, 'text', ctx, makeDeps());
		expect(result).toBe(body);
	});

	it('hands back an empty grpc body when asked', async () => {
		const result = await transitionBody({ type: 'text', payload: '' }, 'grpc', ctx, makeDeps());
		expect(result.type).toBe('grpc');
	});
});

describe('transitionBody — text →', () => {
	const text = { type: 'text' as const, payload: 'hello' };

	it('text → json runs textToEntryJson', async () => {
		const result = await transitionBody(text, 'json', ctx, makeDeps());
		expect(result.type).toBe('json');
	});

	it('text → json_raw preserves the literal payload', async () => {
		const result = await transitionBody(text, 'json_raw', ctx, makeDeps());
		expect(result).toEqual({ type: 'json_raw', payload: 'hello' });
	});

	it('text → url_encoded_form parses key=value pairs from the text', async () => {
		const result = await transitionBody(text, 'url_encoded_form', ctx, makeDeps());
		expect(result.type).toBe('url_encoded_form');
		expect(Object.keys(result.payload as Record<string, unknown>).length).toBeGreaterThan(0);
	});

	it('text → graphql seeds the typed text as the query', async () => {
		const result = await transitionBody(text, 'graphql', ctx, makeDeps());
		expect(result).toEqual({ type: 'graphql', payload: { query: 'hello', variables: {} } });
	});
});

describe('transitionBody — json_raw ↔ json with schemaSeed', () => {
	it('json_raw → json prefers the schemaSeed when provided', async () => {
		const seed = { root: { id: 'root', parentId: null, enabled: true, type: 'object' } };
		const result = await transitionBody({ type: 'json_raw', payload: '{"a":1}' }, 'json', ctx, makeDeps(), {
			schemaSeed: seed as never,
		});
		expect(result).toEqual({ type: 'json', payload: seed });
	});

	it('json_raw → json falls back to text parse when no schemaSeed', async () => {
		const result = await transitionBody({ type: 'json_raw', payload: '{"a":1}' }, 'json', ctx, makeDeps());
		expect(result.type).toBe('json');
	});

	it('json → json_raw stringifies the resolved JSON and stashes the schemaSeed', async () => {
		const payload = { root: { id: 'root', parentId: null, enabled: true, type: 'object' } } as never;
		const result = await transitionBody({ type: 'json', payload }, 'json_raw', ctx, makeDeps());
		expect(result.type).toBe('json_raw');
		expect((result as { schemaSeed?: unknown }).schemaSeed).toBe(payload);
	});
});

describe('transitionBody — graphql ↔ json variable sharing', () => {
	it('graphql → json hoists the variables map as the new payload', async () => {
		const vars = { root: { id: 'root', parentId: null, enabled: true, type: 'object' } };
		const result = await transitionBody(
			{ type: 'graphql', payload: { query: 'q', variables: vars as never } },
			'json',
			ctx,
			makeDeps(),
		);
		expect(result).toEqual({ type: 'json', payload: vars });
	});

	it('json → graphql lifts the payload into variables and clears the query', async () => {
		const payload = { root: { id: 'root', parentId: null, enabled: true, type: 'object' } } as never;
		const result = await transitionBody({ type: 'json', payload }, 'graphql', ctx, makeDeps());
		expect(result).toEqual({ type: 'graphql', payload: { query: '', variables: payload } });
	});
});

describe('transitionBody — → text', () => {
	it('json → text stringifies via convertToRealJson', async () => {
		const result = await transitionBody(
			{ type: 'json', payload: {} as never },
			'text',
			ctx,
			makeDeps({ convertToRealJson: async () => 'hi' }),
		);
		expect(result.type).toBe('text');
		expect((result as { payload: string }).payload).toBe('"hi"');
	});

	it('json → text collapses bare-quote payload to empty', async () => {
		const result = await transitionBody(
			{ type: 'json', payload: {} as never },
			'text',
			ctx,
			makeDeps({ convertToRealJson: async () => '' }),
		);
		expect((result as { payload: string }).payload).toBe('');
	});

	it('url_encoded_form → text runs convertKeyValueToString', async () => {
		const result = await transitionBody(
			{ type: 'url_encoded_form', payload: {} },
			'text',
			ctx,
			makeDeps({ convertKeyValueToString: async () => 'a=1&b=2' }),
		);
		expect(result).toEqual({ type: 'text', payload: 'a=1&b=2' });
	});

	it('graphql → text lifts the query string only', async () => {
		const result = await transitionBody(
			{ type: 'graphql', payload: { query: '{ me }', variables: {} as never } },
			'text',
			ctx,
			makeDeps(),
		);
		expect(result).toEqual({ type: 'text', payload: '{ me }' });
	});

	it('json_raw → text lifts the raw payload verbatim', async () => {
		const result = await transitionBody({ type: 'json_raw', payload: '{}' }, 'text', ctx, makeDeps());
		expect(result).toEqual({ type: 'text', payload: '{}' });
	});
});

describe('createEmptyBody', () => {
	it('mints fresh ids for json + graphql roots', async () => {
		const json = createEmptyBody('json', makeDeps());
		const graphql = createEmptyBody('graphql', makeDeps());
		expect(json.type).toBe('json');
		expect(graphql.type).toBe('graphql');
		expect(Object.keys((json as { payload: object }).payload).length).toBe(1);
	});

	it('returns an empty url_encoded_form payload', () => {
		expect(createEmptyBody('url_encoded_form', makeDeps())).toEqual({ type: 'url_encoded_form', payload: {} });
	});

	it('returns a file stub', () => {
		expect(createEmptyBody('file', makeDeps())).toEqual({
			type: 'file',
			payload: { fileReferenceId: undefined, contentType: undefined },
		});
	});
});
