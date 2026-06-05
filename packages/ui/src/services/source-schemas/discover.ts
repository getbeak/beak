import type { GrpcServiceDescriptor } from '@beak/common/ipc/grpc';
import type { CollectionSource, GrpcDescriptor } from '@beak/state/schemas';

/**
 * Pure-orchestration services for the schema-sources sidebar.
 *
 * Lifted out of `SourceSchemasPane.tsx` so the multi-step "discover →
 * persist → materialise → notify" choreography is testable without
 * mounting the pane. The deps interface mirrors `prepare-request`:
 * every IPC + persistence call goes in as a function so the unit tests
 * can stub them with hand-rolled mocks.
 */

export interface DiscoverDeps {
	discoverMethods: (args: { endpoint: string; descriptor: GrpcDescriptor }) => Promise<{
		discoveredAt: string;
		services: GrpcServiceDescriptor[];
		messages?: Record<string, unknown>;
		enums?: Record<string, unknown>;
	}>;
	writeGrpcDescriptor: (folderPath: string, payload: unknown) => Promise<void>;
	syncGrpcMethodRequestFiles: (folderPath: string, services: GrpcServiceDescriptor[]) => Promise<unknown>;
}

export interface DiscoverInput {
	folderPath: string;
	folderName: string;
	source: Extract<CollectionSource, { type: 'grpc' }>;
}

export type DiscoverResult =
	| { kind: 'ok'; services: GrpcServiceDescriptor[]; descriptor: GrpcDescriptor }
	| { kind: 'skipped'; reason: 'no-descriptor' }
	| { kind: 'error'; errorMessage: string };

/**
 * Run a gRPC discovery roundtrip end-to-end: kick the IPC, persist the
 * sidecar, materialise unary methods as request files. Returns a Result
 * so the caller can decide whether to show the try-it dialog (ok with
 * non-empty services), clear an alert (any ok), or insert one (error).
 *
 * Skips silently when the source has no descriptor — the row UI shows
 * a "Discover" affordance instead.
 */
export async function discoverGrpcMethods(input: DiscoverInput, deps: DiscoverDeps): Promise<DiscoverResult> {
	if (!input.source.descriptor) return { kind: 'skipped', reason: 'no-descriptor' };
	const endpoint = typeof input.source.endpoint === 'string' ? input.source.endpoint : '';
	try {
		const res = await deps.discoverMethods({ endpoint, descriptor: input.source.descriptor });
		await deps.writeGrpcDescriptor(input.folderPath, {
			discoveredAt: res.discoveredAt,
			services: res.services,
			messages: res.messages,
			enums: res.enums,
		});
		// Materialise unary methods as on-disk request files so the user can
		// open + edit them like any other request. Streaming methods stay
		// descriptor-only until the streaming editor lands.
		await deps.syncGrpcMethodRequestFiles(input.folderPath, res.services);
		return { kind: 'ok', services: res.services, descriptor: input.source.descriptor };
	} catch (err) {
		return { kind: 'error', errorMessage: err instanceof Error ? err.message : String(err) };
	}
}
