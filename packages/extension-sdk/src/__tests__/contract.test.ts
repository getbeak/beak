import { describe, expectTypeOf, it } from 'vitest';

import type { AssetRef, EditableVariable, Variable } from '..';

describe('AssetRef shape', () => {
	it('requires sha256 and size; contentType is optional', () => {
		expectTypeOf<AssetRef>().toHaveProperty('sha256').toEqualTypeOf<string>();
		expectTypeOf<AssetRef>().toHaveProperty('size').toEqualTypeOf<number>();
		expectTypeOf<AssetRef>().toHaveProperty('contentType').toEqualTypeOf<string | undefined>();
	});
});

describe('Variable contract', () => {
	interface FilePayload {
		path: string;
	}

	it("getValue is required (handles 'stringify me' sinks)", () => {
		const v: Variable<FilePayload> = {
			name: 'file',
			description: 'reads a file',
			sensitive: false,
			attributes: {},
			createDefaultPayload: async () => ({ path: '' }),
			getValue: async () => '',
		};
		expectTypeOf(v.getValue).parameters.toMatchTypeOf<[unknown, FilePayload, number]>();
	});

	it('getAssetRef is optional and returns AssetRef | null', () => {
		const v: Variable<FilePayload> = {
			name: 'file',
			description: 'reads a file',
			sensitive: false,
			attributes: {},
			createDefaultPayload: async () => ({ path: '' }),
			getValue: async () => '<binary>',
			getAssetRef: async () => ({
				sha256: '0'.repeat(64),
				size: 0,
			}),
		};
		// The compiler accepts the assignment when getAssetRef returns
		// AssetRef. Returning a malformed shape would fail typecheck.
		expectTypeOf(v).toHaveProperty('getAssetRef');
	});

	it('an EditableVariable inherits getAssetRef from Variable', () => {
		type EV = EditableVariable<{ x: string }>;
		expectTypeOf<EV>().toHaveProperty('editor');
		expectTypeOf<EV>().toHaveProperty('getAssetRef');
	});
});
