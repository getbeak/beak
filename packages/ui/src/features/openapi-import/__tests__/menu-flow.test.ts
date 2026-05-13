import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@beak/ui/lib/ipc', () => ({
	ipcOpenApiService: { syncFromSpec: vi.fn() },
}));

const { ipcOpenApiService } = await import('@beak/ui/lib/ipc');
const { runOpenApiImportFlow } = await import('../menu-flow');

const syncFromSpec = ipcOpenApiService.syncFromSpec as unknown as ReturnType<typeof vi.fn>;
const showMessageBox = vi.fn();

const SPEC = JSON.stringify({
	openapi: '3.0.0',
	info: { title: 'x', version: '1' },
	servers: [{ url: 'https://api.example.com' }],
	paths: {},
});

beforeEach(() => {
	syncFromSpec.mockReset();
	showMessageBox.mockReset();
});

describe('runOpenApiImportFlow', () => {
	it('does nothing when the user cancels the picker', async () => {
		await runOpenApiImportFlow({
			dialog: { showMessageBox } as never,
			pickFile: async () => null,
		});
		expect(syncFromSpec).not.toHaveBeenCalled();
		expect(showMessageBox).not.toHaveBeenCalled();
	});

	it('shows an info dialog when the sync succeeds', async () => {
		syncFromSpec.mockResolvedValueOnce({
			collectionPath: 'x',
			requestPaths: ['a'],
			overwritten: [],
			skipped: [],
			warnings: [],
		});
		await runOpenApiImportFlow({
			dialog: { showMessageBox } as never,
			pickFile: async () => ({ filename: 'spec.json', source: SPEC }),
		});
		expect(showMessageBox).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'info', title: 'OpenAPI imported' }),
		);
	});

	it('shows an error dialog when parsing fails', async () => {
		await runOpenApiImportFlow({
			dialog: { showMessageBox } as never,
			pickFile: async () => ({ filename: 'spec.json', source: 'not json' }),
		});
		expect(syncFromSpec).not.toHaveBeenCalled();
		expect(showMessageBox).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', title: 'Import failed' }),
		);
	});

	it('relays IPC errors through the error dialog', async () => {
		syncFromSpec.mockRejectedValueOnce(new Error('targetFolder escapes the project root'));
		await runOpenApiImportFlow({
			dialog: { showMessageBox } as never,
			pickFile: async () => ({ filename: 'spec.json', source: SPEC }),
		});
		expect(showMessageBox).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'error',
				message: expect.stringMatching(/escapes the project root/),
			}),
		);
	});
});
