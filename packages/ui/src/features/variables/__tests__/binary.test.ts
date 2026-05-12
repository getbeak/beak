import type { AssetRef } from '@getbeak/extension-sdk';
import type { Context } from '@getbeak/types/values';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('..', () => ({
	VariableManager: {
		getVariable: vi.fn(),
	},
}));

const { VariableManager } = await import('..');
const { parseValueSectionsForBinary, resolveValuePartForBinary } = await import('../binary');

const getVariable = VariableManager.getVariable as unknown as ReturnType<typeof vi.fn>;

const FAKE_CTX = {} as Context;
const REF: AssetRef = {
	sha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
	size: 12,
	contentType: 'image/png',
};

afterEach(() => {
	getVariable.mockReset();
});

describe('resolveValuePartForBinary', () => {
	beforeEach(() => getVariable.mockReset());

	it('passes literal strings through unchanged', async () => {
		const out = await resolveValuePartForBinary(FAKE_CTX, 'hello', 0);
		expect(out).toBe('hello');
	});

	it('returns an AssetRef when the variable defines getAssetRef', async () => {
		getVariable.mockReturnValueOnce({
			type: 'fileUpload',
			getAssetRef: vi.fn(async () => REF),
			getValue: vi.fn(async () => '[binary]'),
		});
		const out = await resolveValuePartForBinary(
			FAKE_CTX,
			{ type: 'fileUpload', payload: { path: '/x' } },
			0,
		);
		expect(out).toBe(REF);
	});

	it('falls back to getValue when getAssetRef returns null', async () => {
		getVariable.mockReturnValueOnce({
			type: 'fileUpload',
			getAssetRef: vi.fn(async () => null),
			getValue: vi.fn(async () => 'fallback-string'),
		});
		const out = await resolveValuePartForBinary(
			FAKE_CTX,
			{ type: 'fileUpload', payload: {} },
			0,
		);
		expect(out).toBe('fallback-string');
	});

	it('calls getValue when the variable has no getAssetRef', async () => {
		getVariable.mockReturnValueOnce({
			type: 'uuid',
			getValue: vi.fn(async () => 'abc-uuid'),
		});
		const out = await resolveValuePartForBinary(FAKE_CTX, { type: 'uuid', payload: {} }, 0);
		expect(out).toBe('abc-uuid');
	});

	it('returns null when the variable is unknown', async () => {
		getVariable.mockReturnValueOnce(undefined);
		const out = await resolveValuePartForBinary(FAKE_CTX, { type: 'ghost', payload: {} }, 0);
		expect(out).toBeNull();
	});

	it('returns null past the recursion limit', async () => {
		const out = await resolveValuePartForBinary(FAKE_CTX, { type: 'x', payload: {} }, 10);
		expect(out).toBeNull();
	});

	it('returns null when the resolver throws', async () => {
		getVariable.mockReturnValueOnce({
			type: 'boom',
			getAssetRef: vi.fn(async () => {
				throw new Error('boom');
			}),
			getValue: vi.fn(async () => ''),
		});
		const out = await resolveValuePartForBinary(FAKE_CTX, { type: 'boom', payload: {} }, 0);
		expect(out).toBeNull();
	});
});

describe('parseValueSectionsForBinary', () => {
	beforeEach(() => getVariable.mockReset());

	it('returns the first AssetRef along with any text that came before it', async () => {
		getVariable.mockReturnValueOnce({
			type: 'fileUpload',
			getAssetRef: vi.fn(async () => REF),
			getValue: vi.fn(async () => ''),
		});
		const out = await parseValueSectionsForBinary(
			FAKE_CTX,
			['prefix-', { type: 'fileUpload', payload: {} }, 'ignored'],
			0,
		);
		expect(out.ref).toBe(REF);
		if (out.ref) expect(out.precedingText).toBe('prefix-');
	});

	it('concatenates strings when no AssetRef is encountered', async () => {
		const out = await parseValueSectionsForBinary(FAKE_CTX, ['a', 'b'], 0);
		expect(out.ref).toBeNull();
		if (!out.ref) expect(out.text).toBe('ab');
	});

	it('falls back through getValue when getAssetRef returns null', async () => {
		getVariable.mockReturnValue({
			type: 'fileUpload',
			getAssetRef: vi.fn(async () => null),
			getValue: vi.fn(async () => '<bytes>'),
		});
		const out = await parseValueSectionsForBinary(FAKE_CTX, [{ type: 'fileUpload', payload: {} }], 0);
		expect(out.ref).toBeNull();
		if (!out.ref) expect(out.text).toBe('<bytes>');
	});
});
