import type { CollectionFile, GrpcDescriptor } from '@beak/state/schemas';
import { describe, expect, it } from 'vitest';

import { type ResolveGrpcContextDeps, resolveGrpcContext } from '../resolve-descriptor';

const descriptor: GrpcDescriptor = { type: 'reflection' };

function makeDeps(overrides: Partial<ResolveGrpcContextDeps> = {}): ResolveGrpcContextDeps {
	return {
		readCollection: async () =>
			({
				source: { type: 'grpc', endpoint: 'localhost:50051', descriptor },
			}) satisfies CollectionFile,
		readDescriptorSidecar: async () => null,
		joinPath: (folder, file) => `${folder}/${file}`,
		...overrides,
	};
}

describe('resolveGrpcContext', () => {
	it('returns ok with the descriptor when no sidecar exists', async () => {
		const result = await resolveGrpcContext({ folderPath: '/p', service: 'Greeter', method: 'Hello' }, makeDeps());
		expect(result.kind).toBe('ok');
		if (result.kind !== 'ok') throw new Error('unreachable');
		expect(result.endpoint).toBe('localhost:50051');
		expect(result.descriptor).toEqual(descriptor);
		expect(result.requestMessageName).toBeNull();
	});

	it('reports collection-invalid when the collection fails schema validation', async () => {
		const result = await resolveGrpcContext(
			{ folderPath: '/p', service: 'x', method: 'y' },
			makeDeps({ readCollection: async () => ({ wrong: 'shape' }) }),
		);
		expect(result).toEqual({ kind: 'error', reason: 'collection-invalid', collectionPath: '/p/_collection.json' });
	});

	it('reports not-grpc-source when the source is something else', async () => {
		const result = await resolveGrpcContext(
			{ folderPath: '/p', service: 'x', method: 'y' },
			makeDeps({
				readCollection: async () => ({ source: { type: 'manual' } }) satisfies CollectionFile,
			}),
		);
		expect(result.kind).toBe('error');
		if (result.kind === 'error') expect(result.reason).toBe('not-grpc-source');
	});

	it('reports no-descriptor when grpc source has none', async () => {
		const result = await resolveGrpcContext(
			{ folderPath: '/p', service: 'x', method: 'y' },
			makeDeps({
				readCollection: async () => ({ source: { type: 'grpc', endpoint: 'localhost:50051' } }) satisfies CollectionFile,
			}),
		);
		expect(result).toEqual({ kind: 'error', reason: 'no-descriptor' });
	});

	it('resolves request message FQN, preferring exact then leading-dot then suffix', async () => {
		const result = await resolveGrpcContext(
			{ folderPath: '/p', service: 'Greeter', method: 'Hello' },
			makeDeps({
				readDescriptorSidecar: async () => ({
					services: [
						{
							name: 'Greeter',
							methods: [
								{
									name: 'Hello',
									requestType: '.greeter.HelloRequest',
									responseType: '.greeter.HelloReply',
									requestStream: false,
									responseStream: false,
								},
							],
						},
					],
					messages: { 'greeter.HelloRequest': { name: 'greeter.HelloRequest', fields: [], oneofs: [] } },
				}),
			}),
		);
		expect(result.kind).toBe('ok');
		if (result.kind === 'ok') expect(result.requestMessageName).toBe('greeter.HelloRequest');
	});

	it('returns caught when readCollection throws', async () => {
		const result = await resolveGrpcContext(
			{ folderPath: '/p', service: 'x', method: 'y' },
			makeDeps({
				readCollection: async () => {
					throw new Error('ENOENT');
				},
			}),
		);
		expect(result).toEqual({ kind: 'error', reason: 'caught', message: 'ENOENT' });
	});
});
