import { describe, expect, it, vi } from 'vitest';

import { syncOpenApiFromSource } from '../sync-openapi';

describe('syncOpenApiFromSource', () => {
	it('skips when the source has no specUrl', async () => {
		const syncFromUrl = vi.fn();
		const result = await syncOpenApiFromSource(
			{ folderPath: '/p', folderName: 'p', source: { type: 'openapi' } },
			{ syncFromUrl: syncFromUrl as never },
		);
		expect(result).toEqual({ kind: 'skipped', reason: 'no-spec-url' });
		expect(syncFromUrl).not.toHaveBeenCalled();
	});

	it('returns ok on a successful sync', async () => {
		const result = await syncOpenApiFromSource(
			{
				folderPath: '/p',
				folderName: 'p',
				source: { type: 'openapi', specUrl: 'https://example.com/spec.yaml', autoSync: true, intervalMinutes: 30 },
			},
			{
				syncFromUrl: async args => {
					expect(args).toEqual({
						targetFolder: '/p',
						url: 'https://example.com/spec.yaml',
						autoSync: true,
						intervalMinutes: 30,
					});
					return { ok: true, result: {} as never };
				},
			},
		);
		expect(result).toEqual({ kind: 'ok' });
	});

	it('returns the error message verbatim on failure', async () => {
		const result = await syncOpenApiFromSource(
			{ folderPath: '/p', folderName: 'p', source: { type: 'openapi', specUrl: 'https://nope' } },
			{ syncFromUrl: async () => ({ ok: false, error: 'HTTP 404' }) },
		);
		expect(result).toEqual({ kind: 'error', errorMessage: 'HTTP 404' });
	});
});
