import type { AssetRef } from '@getbeak/extension-sdk';
import type { Context } from '@getbeak/types/values';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../parser', () => ({
	getValueObject: vi.fn(),
	parseValueSections: vi.fn(async (_ctx, parts) =>
		parts.map((p: unknown) => (typeof p === 'string' ? p : `<${(p as { type: string }).type}>`)).join(''),
	),
}));

const { getValueObject } = await import('../../parser');
const definition = (await import('../variable-set-item')).default;

const getValueObjectMock = getValueObject as unknown as ReturnType<typeof vi.fn>;

const REF: AssetRef = {
	sha256: 'aa'.repeat(32),
	size: 12,
	contentType: 'application/octet-stream',
};

function makeRctx(sinkKind: 'text' | 'binary' | 'stream') {
	return {
		variableContext: {} as Context,
		sink: { kind: sinkKind } as { kind: 'text' | 'binary' | 'stream' },
		depth: 0,
	};
}

describe('variable_set_item resolve', () => {
	it('asset-typed value resolves to an asset producer for binary sinks', async () => {
		getValueObjectMock.mockReturnValueOnce({ kind: 'asset', ref: REF, filename: 'cert.pem' });
		const rv = await definition.resolve(makeRctx('binary'), { itemId: 'x' });
		expect(rv).toEqual({ kind: 'asset', ref: REF });
	});

	it('asset-typed value resolves to a placeholder for text sinks', async () => {
		getValueObjectMock.mockReturnValueOnce({ kind: 'asset', ref: REF, filename: 'cert.pem' });
		const rv = await definition.resolve(makeRctx('text'), { itemId: 'x' });
		expect(rv).toEqual({ kind: 'text', text: '[file cert.pem]' });
	});

	it('asset-typed value without filename uses a sha-prefix placeholder', async () => {
		getValueObjectMock.mockReturnValueOnce({ kind: 'asset', ref: REF });
		const rv = await definition.resolve(makeRctx('text'), { itemId: 'x' });
		expect(rv).toEqual({ kind: 'text', text: `[file sha:${REF.sha256.slice(0, 10)}]` });
	});

	it('tagged-text value resolves through parseValueSections', async () => {
		getValueObjectMock.mockReturnValueOnce({ kind: 'text', value: ['hello'] });
		const rv = await definition.resolve(makeRctx('text'), { itemId: 'x' });
		expect(rv).toEqual({ kind: 'text', text: 'hello' });
	});

	it('legacy bare ValueSections array resolves through parseValueSections', async () => {
		getValueObjectMock.mockReturnValueOnce(['legacy']);
		const rv = await definition.resolve(makeRctx('text'), { itemId: 'x' });
		expect(rv).toEqual({ kind: 'text', text: 'legacy' });
	});

	it('missing value yields empty text', async () => {
		getValueObjectMock.mockReturnValueOnce(null);
		const rv = await definition.resolve(makeRctx('text'), { itemId: 'x' });
		expect(rv).toEqual({ kind: 'text', text: '' });
	});
});
