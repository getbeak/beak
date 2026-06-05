import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@beak/ui/lib/ipc', () => ({
	ipcAssetsService: { write: vi.fn() },
}));

const { ipcAssetsService } = await import('@beak/ui/lib/ipc');
const { attachFile } = await import('../attach-file');

const write = ipcAssetsService.write as unknown as ReturnType<typeof vi.fn>;

const SAMPLE_REF = {
	sha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
	size: 11,
	contentType: 'text/plain',
};

beforeEach(() => write.mockReset());

describe('attachFile', () => {
	it('returns the ref + filename when the IPC write succeeds', async () => {
		write.mockResolvedValueOnce({
			ref: SAMPLE_REF,
			relativePath: `_assets/${SAMPLE_REF.sha256.slice(0, 2)}/${SAMPLE_REF.sha256}`,
		});
		const result = await attachFile({
			file: {
				name: 'photo.png',
				type: 'image/png',
				bytes: new TextEncoder().encode('hello world'),
			},
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.filename).toBe('photo.png');
		expect(result.ref).toEqual(SAMPLE_REF);
		expect(result.relativePath).toContain('_assets/');
	});

	it('forwards the file type through to the IPC payload as contentType', async () => {
		write.mockResolvedValueOnce({ ref: SAMPLE_REF, relativePath: 'x' });
		await attachFile({
			file: { name: 'a', type: 'image/png', bytes: new Uint8Array([1, 2, 3]) },
		});
		expect(write).toHaveBeenCalledWith({
			bytes: expect.any(Uint8Array),
			contentType: 'image/png',
		});
	});

	it('omits contentType when the browser leaves it blank', async () => {
		write.mockResolvedValueOnce({ ref: SAMPLE_REF, relativePath: 'x' });
		await attachFile({ file: { name: 'a', type: '', bytes: new Uint8Array([1]) } });
		expect(write).toHaveBeenCalledWith({
			bytes: expect.any(Uint8Array),
			contentType: undefined,
		});
	});

	it('refuses an empty file before hitting IPC', async () => {
		const result = await attachFile({
			file: { name: 'empty.bin', type: '', bytes: new Uint8Array(0) },
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toMatch(/empty/);
		expect(write).not.toHaveBeenCalled();
	});

	it('relays IPC errors as a friendly outcome', async () => {
		write.mockRejectedValueOnce(new Error('disk full'));
		const result = await attachFile({
			file: { name: 'a', type: '', bytes: new Uint8Array([1]) },
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toMatch(/disk full/);
	});
});
