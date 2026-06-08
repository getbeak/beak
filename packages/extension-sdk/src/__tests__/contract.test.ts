import { describe, expectTypeOf, it } from 'vitest';

import type { AssetRef, EditableVariable, ResolveContext, ResolvedValue, Sink, Variable, VariableDefinition } from '..';
import { type CURRENT_API_VERSION, defineVariable } from '..';

describe('AssetRef shape', () => {
	it('requires sha256 and size; contentType is optional', () => {
		expectTypeOf<AssetRef>().toHaveProperty('sha256').toEqualTypeOf<string>();
		expectTypeOf<AssetRef>().toHaveProperty('size').toEqualTypeOf<number>();
		expectTypeOf<AssetRef>().toHaveProperty('contentType').toEqualTypeOf<string | undefined>();
	});
});

describe('Sink + ResolveContext + ResolvedValue', () => {
	it('Sink is a discriminated union of text/binary/stream', () => {
		expectTypeOf<Sink>().toEqualTypeOf<{ kind: 'text' } | { kind: 'binary' } | { kind: 'stream' }>();
	});

	it('ResolvedValue carries four kinds', () => {
		const text: ResolvedValue = { kind: 'text', text: 'hi' };
		const bytes: ResolvedValue = { kind: 'bytes', bytes: new Uint8Array() };
		const asset: ResolvedValue = { kind: 'asset', ref: { sha256: '0'.repeat(64), size: 0 } };
		const stream: ResolvedValue = {
			kind: 'stream',
			stream: null as unknown as ReadableStream<Uint8Array>,
		};
		expectTypeOf(text).toMatchTypeOf<ResolvedValue>();
		expectTypeOf(bytes).toMatchTypeOf<ResolvedValue>();
		expectTypeOf(asset).toMatchTypeOf<ResolvedValue>();
		expectTypeOf(stream).toMatchTypeOf<ResolvedValue>();
	});

	it('ResolveContext bundles the variable context, the sink, and depth', () => {
		expectTypeOf<ResolveContext>().toHaveProperty('variableContext');
		expectTypeOf<ResolveContext>().toHaveProperty('sink').toEqualTypeOf<Sink>();
		expectTypeOf<ResolveContext>().toHaveProperty('depth').toEqualTypeOf<number>();
	});
});

describe('Variable contract', () => {
	interface FilePayload {
		path: string;
	}

	it('CURRENT_API_VERSION is the literal 2', () => {
		expectTypeOf<typeof CURRENT_API_VERSION>().toEqualTypeOf<2>();
	});

	it('VariableDefinition takes a single resolve callback (no getValue/getAssetRef)', () => {
		const def = defineVariable<{ format: 'unix' | 'iso' }>({
			id: 'timestamp',
			name: 'Timestamp',
			description: 'Current timestamp',
			createDefaultPayload: () => ({ format: 'unix' }),
			resolve: async (_extCtx, _ctx, payload) => ({
				kind: 'text',
				text: payload.format === 'iso' ? new Date().toISOString() : String(Math.floor(Date.now() / 1000)),
			}),
		});

		expectTypeOf(def).toMatchTypeOf<VariableDefinition<{ format: 'unix' | 'iso' }>>();
		// `getValue` / `getAssetRef` are gone — the contract is `resolve` only.
		expectTypeOf(def).not.toHaveProperty('getValue');
		expectTypeOf(def).not.toHaveProperty('getAssetRef');
	});

	it('internal Variable shape resolves to ResolvedValue', () => {
		const v: Variable<FilePayload> = {
			name: 'file',
			description: 'reads a file',
			sensitive: false,
			attributes: {},
			createDefaultPayload: async () => ({ path: '' }),
			resolve: async () => ({ kind: 'text', text: '' }),
		};
		expectTypeOf(v.resolve).returns.resolves.toEqualTypeOf<ResolvedValue>();
	});

	it('an EditableVariable inherits resolve from Variable + adds an editor', () => {
		type EV = EditableVariable<{ x: string }>;
		expectTypeOf<EV>().toHaveProperty('editor');
		expectTypeOf<EV>().toHaveProperty('resolve');
	});
});
