import type { GrpcEnumDescriptor, GrpcMessageDescriptor, GrpcServiceDescriptor } from '@beak/common/ipc/grpc';
import type { CollectionFile, GrpcDescriptor } from '@beak/state/schemas';
import { collectionFileSchema } from '@beak/state/schemas';

/**
 * Walk the request-file's owning gRPC endpoint folder, parse its
 * `_collection.json`, load the persisted descriptor sidecar, and resolve
 * the request-message FQN. Previously this lived as a 70-line
 * `useEffect` inside `GrpcRequestPane.tsx`; extracting it lets the
 * resolution be unit-tested without React + makes the error cases
 * structurally explicit.
 */

export interface ResolveGrpcContextDeps {
	/** Read the endpoint folder's `_collection.json` and return its parsed bytes. */
	readCollection: (collectionPath: string) => Promise<unknown>;
	/**
	 * Load the sibling `_grpc.json` sidecar that `Discover` writes. Returns
	 * `null` when the file is missing — the Fields editor falls back to
	 * "no schema" state in that case.
	 */
	readDescriptorSidecar: (folderPath: string) => Promise<{
		services: GrpcServiceDescriptor[];
		messages?: Record<string, GrpcMessageDescriptor>;
		enums?: Record<string, GrpcEnumDescriptor>;
	} | null>;
	/** Build the absolute path of a sibling file in a folder. */
	joinPath: (folderPath: string, filename: string) => string;
}

export interface ResolveGrpcContextInput {
	folderPath: string;
	service: string;
	method: string;
}

export type ResolveGrpcContextResult =
	| {
			kind: 'ok';
			endpoint: string;
			descriptor: GrpcDescriptor;
			services: GrpcServiceDescriptor[];
			messagesByName: Record<string, GrpcMessageDescriptor>;
			enumsByName: Record<string, GrpcEnumDescriptor>;
			requestMessageName: string | null;
	  }
	| { kind: 'error'; reason: 'collection-invalid'; collectionPath: string }
	| { kind: 'error'; reason: 'not-grpc-source'; collectionPath: string }
	| { kind: 'error'; reason: 'no-descriptor' }
	| { kind: 'error'; reason: 'caught'; message: string };

/**
 * Resolve the full editor context for a gRPC request: parse the parent
 * collection, then enrich with the descriptor sidecar (when present)
 * + the request-message lookup. Pure: every IO point is an injected
 * dep so the tests can hand-roll them.
 */
export async function resolveGrpcContext(
	input: ResolveGrpcContextInput,
	deps: ResolveGrpcContextDeps,
): Promise<ResolveGrpcContextResult> {
	const collectionPath = deps.joinPath(input.folderPath, '_collection.json');
	let raw: unknown;
	try {
		raw = await deps.readCollection(collectionPath);
	} catch (err) {
		return { kind: 'error', reason: 'caught', message: err instanceof Error ? err.message : String(err) };
	}

	const parsed = collectionFileSchema.safeParse(raw);
	if (!parsed.success) return { kind: 'error', reason: 'collection-invalid', collectionPath };

	const collection = parsed.data as CollectionFile;
	if (collection.source.type !== 'grpc') return { kind: 'error', reason: 'not-grpc-source', collectionPath };

	const descriptor = collection.source.descriptor;
	if (!descriptor) return { kind: 'error', reason: 'no-descriptor' };

	let persisted: Awaited<ReturnType<typeof deps.readDescriptorSidecar>>;
	try {
		persisted = await deps.readDescriptorSidecar(input.folderPath);
	} catch (err) {
		return { kind: 'error', reason: 'caught', message: err instanceof Error ? err.message : String(err) };
	}

	const services = persisted?.services ?? [];
	const messagesByName = persisted?.messages ?? {};
	const enumsByName = persisted?.enums ?? {};
	const requestMessageName = resolveRequestMessageName(services, messagesByName, input.service, input.method);

	return {
		kind: 'ok',
		endpoint: collection.source.endpoint,
		descriptor,
		services,
		messagesByName,
		enumsByName,
		requestMessageName,
	};
}

/**
 * Find the FQ message name for a service / method pair. Reflection
 * sometimes hands back leading-dot FQ names (`.helloworld.Hello`); we
 * tolerate either form by stripping the leading dot, then falling back
 * to a suffix match for legacy specs.
 */
function resolveRequestMessageName(
	services: GrpcServiceDescriptor[],
	messagesByName: Record<string, GrpcMessageDescriptor>,
	service: string,
	method: string,
): string | null {
	const svc = services.find(s => s.name === service);
	const m = svc?.methods.find(x => x.name === method);
	if (!m) return null;

	const target = m.requestType;
	const trimmed = target.startsWith('.') ? target.slice(1) : target;
	if (messagesByName[target]) return target;
	if (messagesByName[trimmed]) return trimmed;
	return Object.keys(messagesByName).find(k => k === trimmed || k.endsWith(`.${trimmed}`)) ?? null;
}
