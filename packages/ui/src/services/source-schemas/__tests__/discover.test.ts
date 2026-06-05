import type { GrpcDescriptor } from '@beak/state/schemas';
import { describe, expect, it, vi } from 'vitest';

import { type DiscoverDeps, discoverGrpcMethods } from '../discover';

const descriptor: GrpcDescriptor = { type: 'reflection' };

function makeDeps(overrides: Partial<DiscoverDeps> = {}): DiscoverDeps {
	return {
		discoverMethods: vi.fn(async () => ({
			discoveredAt: '2026-05-17T00:00:00Z',
			services: [{ name: 'Hello', methods: [] }],
		})),
		writeGrpcDescriptor: vi.fn(async () => {}),
		syncGrpcMethodRequestFiles: vi.fn(async () => ({ writtenPaths: [], ownedIds: [] })),
		...overrides,
	};
}

describe('discoverGrpcMethods', () => {
	it('skips when the source has no descriptor', async () => {
		const deps = makeDeps();
		const result = await discoverGrpcMethods(
			{ folderPath: '/p', folderName: 'p', source: { type: 'grpc', endpoint: 'localhost:50051' } },
			deps,
		);
		expect(result).toEqual({ kind: 'skipped', reason: 'no-descriptor' });
		expect(deps.discoverMethods).not.toHaveBeenCalled();
	});

	it('returns ok with the discovered services on the happy path', async () => {
		const result = await discoverGrpcMethods(
			{ folderPath: '/p', folderName: 'p', source: { type: 'grpc', endpoint: 'localhost:50051', descriptor } },
			makeDeps(),
		);
		expect(result.kind).toBe('ok');
		if (result.kind !== 'ok') throw new Error('unreachable');
		expect(result.services).toEqual([{ name: 'Hello', methods: [] }]);
		expect(result.descriptor).toEqual(descriptor);
	});

	it('persists the sidecar + materialises method request files on success', async () => {
		const deps = makeDeps();
		await discoverGrpcMethods(
			{ folderPath: '/p', folderName: 'p', source: { type: 'grpc', endpoint: 'localhost:50051', descriptor } },
			deps,
		);
		expect(deps.writeGrpcDescriptor).toHaveBeenCalledWith(
			'/p',
			expect.objectContaining({ discoveredAt: '2026-05-17T00:00:00Z' }),
		);
		expect(deps.syncGrpcMethodRequestFiles).toHaveBeenCalled();
	});

	it('returns an error result when the IPC throws', async () => {
		const result = await discoverGrpcMethods(
			{ folderPath: '/p', folderName: 'p', source: { type: 'grpc', endpoint: '', descriptor } },
			makeDeps({
				discoverMethods: async () => {
					throw new Error('connection refused');
				},
			}),
		);
		expect(result).toEqual({ kind: 'error', errorMessage: 'connection refused' });
	});
});
