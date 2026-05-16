import ksuid from '@beak/ksuid';
import type { CollectionFile, CollectionSource, GrpcDescriptor } from '@beak/state/schemas';
import { collectionFileSchema } from '@beak/state/schemas';
import type { RequestNodeFile } from '@getbeak/types/nodes';
import path from 'path-browserify';

import { ipcFsService } from '../../../lib/ipc';
import type { EndpointKind } from '../types';

const COLLECTION_FILENAME = '_collection.json';

/**
 * Path layout for endpoints: every endpoint lives at
 * `tree/endpoints/<kind>/<folderName>/`. Keeps them grouped + visually
 * separated from hand-authored request folders, and makes the kind
 * inspectable from the path alone.
 */
function endpointsBase(projectFolderPath: string, kind: EndpointKind): string {
	return path.join(projectFolderPath, 'tree', 'endpoints', kind);
}

export interface CreateEndpointInput {
	kind: EndpointKind;
	folderName: string;
	endpoint: string;
	/**
	 * gRPC descriptor source — only meaningful when `kind === 'grpc'`. The
	 * dialog defaults to `{ type: 'reflection' }`. Undefined leaves the
	 * source's `descriptor` field absent (descriptors haven't been picked
	 * yet); the request pane will surface a Discover affordance.
	 */
	descriptor?: GrpcDescriptor;
}

export interface UpdateEndpointInput {
	endpoint?: string;
	descriptor?: GrpcDescriptor;
}

const GRAPHQL_INTROSPECTION_QUERY = `query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types { ...FullType }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args { ...InputValue }
    type { ...TypeRef }
    isDeprecated
    deprecationReason
  }
  inputFields { ...InputValue }
  interfaces { ...TypeRef }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes { ...TypeRef }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType { kind name }
}`;

/**
 * Seed a request file inside an endpoint folder so the user lands in the
 * request pane on click. For GraphQL the seed is a ready-to-fire
 * introspection query — hitting Send returns the SDL.
 * For gRPC we leave it as a minimal POST against the endpoint URL until
 * proto-descriptor support lands.
 */
async function writeSeedRequest(folderPath: string, input: CreateEndpointInput): Promise<string> {
	const id = ksuid.generate('request').toString();
	const name = input.kind === 'graphql' ? 'Introspection' : 'Endpoint';
	const fullPath = path.join(folderPath, `${name}.json`);

	const request: RequestNodeFile = {
		id,
		verb: input.kind === 'graphql' ? 'post' : 'post',
		url: [input.endpoint],
		query: {},
		headers: {},
		body:
			input.kind === 'graphql'
				? {
						type: 'graphql',
						payload: { query: GRAPHQL_INTROSPECTION_QUERY, variables: {} },
					}
				: { type: 'text', payload: '' },
		options: {
			followRedirects: false,
			decompressResponse: true,
			timeoutMs: 0,
			maxRedirects: 5,
		},
	};

	await ipcFsService.writeJson(fullPath, request, { spaces: '\t' });
	return id;
}

/**
 * Create an endpoint folder at `tree/endpoints/<kind>/<folderName>/`,
 * write its `_collection.json` declaring the source, and seed a request
 * file so the click-through has somewhere to land. Returns both paths +
 * the seed request id so the caller can open it as a tab.
 */
export async function createEndpointFolder(
	projectFolderPath: string,
	input: CreateEndpointInput,
): Promise<{ folderPath: string; requestId: string }> {
	const base = endpointsBase(projectFolderPath, input.kind);
	const folderPath = path.join(base, input.folderName);

	if (await ipcFsService.pathExists(folderPath))
		throw new Error(`A folder named "${input.folderName}" already exists under endpoints/${input.kind}/.`);

	const source: CollectionSource =
		input.kind === 'graphql'
			? { type: 'graphql', endpoint: input.endpoint }
			: {
					type: 'grpc',
					endpoint: input.endpoint,
					...(input.descriptor ? { descriptor: input.descriptor } : {}),
				};

	const collection: CollectionFile = { source };
	collectionFileSchema.parse(collection);

	await ipcFsService.ensureDir(folderPath);
	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	await ipcFsService.writeJson(collectionPath, collection, { spaces: '\t' });

	const requestId = await writeSeedRequest(folderPath, input);

	return { folderPath, requestId };
}

/**
 * Mutate an existing endpoint collection's `_collection.json` in place.
 * The endpoint URL is the only field this surface still edits — auth /
 * headers / variables now happen on the seed request itself (opened in
 * the regular request pane).
 */
export async function updateEndpoint(
	folderPath: string,
	kind: EndpointKind,
	patch: UpdateEndpointInput,
): Promise<void> {
	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	const raw = await ipcFsService.readJson<unknown>(collectionPath);
	const parsed = collectionFileSchema.safeParse(raw);
	if (!parsed.success) throw new Error(`Collection at ${collectionPath} failed schema validation.`);
	if (parsed.data.source.type !== kind)
		throw new Error(`Collection at ${collectionPath} is not a ${kind} source.`);

	const next: CollectionFile = {
		...parsed.data,
		source: {
			...parsed.data.source,
			...(patch.endpoint !== undefined ? { endpoint: patch.endpoint } : {}),
			...(kind === 'grpc' && patch.descriptor !== undefined ? { descriptor: patch.descriptor } : {}),
		},
	};

	const revalidated = collectionFileSchema.safeParse(next);
	if (!revalidated.success) throw new Error('Updated collection failed schema validation.');

	await ipcFsService.writeJson(collectionPath, revalidated.data, { spaces: '\t' });
}
