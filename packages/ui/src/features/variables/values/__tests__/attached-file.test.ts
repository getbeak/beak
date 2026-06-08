import type { AssetRef } from '@getbeak/extension-sdk';
import type { Context } from '@getbeak/types/values';
import { describe, expect, it } from 'vitest';

import definition from '../attached-file';

const REF: AssetRef = {
	sha256: 'bb'.repeat(32),
	size: 7,
	contentType: 'image/png',
};

function makeRctx(sinkKind: 'text' | 'binary' | 'stream') {
	return {
		variableContext: {} as Context,
		sink: { kind: sinkKind } as { kind: 'text' | 'binary' | 'stream' },
		depth: 0,
	};
}

describe('attached_file resolve', () => {
	it('binary sink + assetRef → asset producer', async () => {
		const rv = await definition.resolve(makeRctx('binary'), { assetRef: REF, filename: 'pic.png' });
		expect(rv).toEqual({ kind: 'asset', ref: REF });
	});

	it('stream sink + assetRef → asset producer', async () => {
		const rv = await definition.resolve(makeRctx('stream'), { assetRef: REF, filename: 'pic.png' });
		expect(rv).toEqual({ kind: 'asset', ref: REF });
	});

	it('text sink + assetRef → [file <filename>] placeholder', async () => {
		const rv = await definition.resolve(makeRctx('text'), { assetRef: REF, filename: 'pic.png' });
		expect(rv).toEqual({ kind: 'text', text: '[file pic.png]' });
	});

	it('text sink + assetRef without filename → sha-prefix placeholder', async () => {
		const rv = await definition.resolve(makeRctx('text'), { assetRef: REF, filename: undefined });
		expect(rv).toEqual({ kind: 'text', text: `[file sha:${REF.sha256.slice(0, 10)}]` });
	});

	it('no assetRef → empty text regardless of sink', async () => {
		const rvText = await definition.resolve(makeRctx('text'), { assetRef: undefined, filename: undefined });
		const rvBinary = await definition.resolve(makeRctx('binary'), { assetRef: undefined, filename: undefined });
		expect(rvText).toEqual({ kind: 'text', text: '' });
		expect(rvBinary).toEqual({ kind: 'text', text: '' });
	});

	it('getContextAwareName uses the filename when present', () => {
		expect(definition.getContextAwareName?.({ assetRef: REF, filename: 'cert.pem' })).toBe('File (cert.pem)');
		expect(definition.getContextAwareName?.({ assetRef: REF, filename: undefined })).toBe('File');
	});
});
