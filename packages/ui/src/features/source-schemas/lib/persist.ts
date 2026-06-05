import type { SyncFromSpecRes } from '@beak/common/ipc/openapi';
import ksuid from '@beak/ksuid';
import type { CollectionFile, CollectionSource, GrpcDescriptor } from '@beak/state/schemas';
import { collectionFileSchema } from '@beak/state/schemas';
import type { RequestNodeFile } from '@getbeak/types/nodes';
import path from 'path-browserify';

import { ipcFsService, ipcOpenApiService } from '../../../lib/ipc';
import { looksLikeOpenApi3, parseSpecSource } from '../../openapi-import/parse-spec-source';
import { syncFromUrl } from '../../project-home/lib/sync-from-url';
import type { SourceSchemaKind } from '../types';

const COLLECTION_FILENAME = '_collection.json';

/**
 * Path layout for schema sources: the folder lives at `tree/<folderName>/`
 * with no auto-prefix. The user picks the path — Beak does not impose its
 * own organising directory. Paths are project-relative — the fs IPC layer
 * (`ensureWithinProject`) resolves them against the open project's folder
 * before touching disk.
 *
 * `kind` is unused at the path level, but kept on the signature so callers
 * can pass it without juggling a parallel API.
 */
function sourceSchemasBase(_kind: SourceSchemaKind): string {
	return 'tree';
}

export interface CreateSourceSchemaInput {
	kind: SourceSchemaKind;
	/**
	 * Folder name under `tree/`. Blank string → drop the source at the
	 * project root (`tree/_collection.json`). Single-source-at-root means
	 * the dialog warns first via `peekRootSource` if the root already
	 * carries a non-manual source; this function trusts the caller has
	 * confirmed.
	 */
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

export interface UpdateSourceSchemaInput {
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
 * Seed a request file inside a GraphQL endpoint folder so the user lands in
 * the request pane on click. The seed is a ready-to-fire introspection query
 * — hitting Send returns the SDL.
 *
 * We do NOT seed a request for gRPC: there is no host-side gRPC requester
 * yet (no proto parsing, no reflection, no method invocation), so an HTTP
 * POST stub against the gRPC URL would only lead users into a confusing
 * dead end. Clicking a gRPC endpoint row opens the edit dialog instead;
 * once method invocation is wired we'll seed a typed gRPC method stub here.
 */
async function writeSeedRequest(folderPath: string, input: CreateSourceSchemaInput): Promise<string | null> {
	if (input.kind !== 'graphql') return null;

	const id = ksuid.generate('request').toString();
	// Filename = what shows up in the project tree (minus `.json`). "Discover
	// schema" mirrors gRPC's "Discover methods" verb and reads better than the
	// older "Introspection" jargon.
	const fullPath = path.join(folderPath, 'Discover schema.json');

	const request: RequestNodeFile = {
		id,
		verb: 'post',
		url: [input.endpoint],
		query: {},
		headers: {},
		body: {
			type: 'graphql',
			payload: { query: GRAPHQL_INTROSPECTION_QUERY, variables: {} },
		},
		options: {
			followRedirects: false,
			decompressResponse: true,
			timeoutMs: 0,
			maxRedirects: 5,
		},
		introspection: true,
	};

	await ipcFsService.writeJson(fullPath, request, { spaces: '\t' });
	return id;
}

/**
 * Create an endpoint folder at `tree/endpoints/<kind>/<folderName>/`,
 * write its `_collection.json` declaring the source, and seed a request
 * file so the click-through has somewhere to land. The folder path is
 * project-relative — IPC resolves it against the open project.
 *
 * Returns the path + the seed request id when one exists. gRPC endpoints
 * currently get no seed (no host-side gRPC client yet), so callers must
 * handle `requestId === null` by opening the edit dialog or a placeholder
 * instead of a request tab.
 */
export async function createSourceSchemaFolder(
	input: CreateSourceSchemaInput,
): Promise<{ folderPath: string; requestId: string | null }> {
	const trimmed = input.folderName.trim();
	const isRoot = trimmed.length === 0;
	const folderPath = isRoot ? sourceSchemasBase(input.kind) : path.join(sourceSchemasBase(input.kind), trimmed);

	if (!isRoot && (await ipcFsService.pathExists(folderPath)))
		throw new Error(`A folder named "${trimmed}" already exists in the project tree.`);

	const source: CollectionSource =
		input.kind === 'graphql'
			? { type: 'graphql', endpoint: input.endpoint }
			: {
					type: 'grpc',
					endpoint: input.endpoint,
					...(input.descriptor ? { descriptor: input.descriptor } : {}),
				};

	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	// Root mode preserves any existing `defaults` and replaces only the
	// source field; sub-folder mode writes a fresh collection.
	const existing = isRoot ? await readCollectionIfPresent(collectionPath) : null;
	const collection: CollectionFile = existing ? { ...existing, source } : { source };

	collectionFileSchema.parse(collection);

	await ipcFsService.ensureDir(folderPath);
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
export async function updateSourceSchema(
	folderPath: string,
	kind: SourceSchemaKind,
	patch: UpdateSourceSchemaInput,
): Promise<void> {
	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	const raw = await ipcFsService.readJson<unknown>(collectionPath);
	const parsed = collectionFileSchema.safeParse(raw);
	if (!parsed.success) throw new Error(`Collection at ${collectionPath} failed schema validation.`);
	if (parsed.data.source.type !== kind) throw new Error(`Collection at ${collectionPath} is not a ${kind} source.`);

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

/**
 * Recursively remove an endpoint folder + everything inside it. The host's
 * fs IPC handles directory removal; the project tree's fs-watcher picks up
 * the change and the renderer's tree state catches up. Caller should refresh
 * the endpoints hook to drop the entry from the sidebar immediately rather
 * than waiting for the watcher tick.
 */
export async function deleteSourceSchemaFolder(folderPath: string): Promise<void> {
	await ipcFsService.remove(folderPath);
}

/**
 * Read the source declared on the project root's `tree/_collection.json`,
 * if any. Used by the dialog to warn before a root drop would overwrite
 * an existing non-manual source. Returns `null` when the file is missing
 * or malformed — both are safe to drop a fresh source onto.
 */
export async function peekRootSource(): Promise<CollectionSource | null> {
	const collectionPath = path.join('tree', COLLECTION_FILENAME);
	const existing = await readCollectionIfPresent(collectionPath);
	return existing ? existing.source : null;
}

async function readCollectionIfPresent(collectionPath: string): Promise<CollectionFile | null> {
	if (!(await ipcFsService.pathExists(collectionPath))) return null;
	try {
		const raw = await ipcFsService.readJson<unknown>(collectionPath);
		const parsed = collectionFileSchema.safeParse(raw);
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

/**
 * Project an endpoint URL onto a filesystem-friendly folder name. Used by
 * the dialog's "derive folder name from URL" toggle. Strips the scheme +
 * path, drops a leading `www.`, replaces dots with dashes, and caps the
 * length. Falls back to an empty string on unparseable input — the caller
 * treats that as "use root" or "no suggestion".
 */
export function deriveFolderNameFromUrl(endpoint: string): string {
	const trimmed = endpoint.trim();
	if (!trimmed) return '';
	try {
		const url = new URL(trimmed);
		const host = url.hostname.replace(/^www\./i, '');
		if (!host) return '';
		return host
			.replace(/[^a-zA-Z0-9.-]/g, '')
			.replace(/\./g, '-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 80);
	} catch {
		return '';
	}
}

// ─── OpenAPI ──────────────────────────────────────────────────────────────
//
// OpenAPI schema sources share the same `tree/<folderName>/`
// layout as graphql / grpc but the create flow is meaningfully different:
// instead of a single URL + optional descriptor it takes a seed source
// (file / url / paste), runs the importer through the host's openapi IPC,
// and lands a whole folder of generated request files. Persistence of the
// collection itself happens inside the IPC handler — the converter writes
// `_collection.json` with the chosen seedMode + specPath/specUrl/etc.

export interface CreateOpenApiSourceSchemaInput {
	/**
	 * Folder name under `tree/`. Blank string → drop the generated
	 * collection + requests at the project root (`tree/`), replacing the
	 * root `_collection.json`. Single-source-at-root: callers should peek
	 * first and confirm if the root already carries a non-manual source.
	 */
	folderName: string;
	/**
	 * Mirror the spec's URL hierarchy in the generated tree — `/api/agents/{id}`
	 * lands under `api/agents/`. Off by default; users opt in per import.
	 */
	groupByPath?: boolean;
	/**
	 * Where the spec came from. `paste` covers ad-hoc imports without a
	 * re-sync source; `file` records the filename (no on-disk path on web
	 * shells); `url` keeps the URL and is the only mode that supports
	 * auto-sync.
	 */
	seed:
		| { mode: 'url'; url: string; autoSync?: boolean; intervalMinutes?: number }
		| { mode: 'file'; filename: string; source: string }
		| { mode: 'paste'; source: string };
}

export interface CreateOpenApiSourceSchemaResult {
	folderPath: string;
	sync: SyncFromSpecRes;
}

/**
 * Create `tree/<folderName>/`, run the importer, and
 * write the generated collection + request files. Throws on bad spec
 * input so the caller can surface the message in the dialog.
 */
export async function createOpenApiSourceSchemaFolder(
	input: CreateOpenApiSourceSchemaInput,
): Promise<CreateOpenApiSourceSchemaResult> {
	const trimmed = input.folderName.trim();
	const isRoot = trimmed.length === 0;
	const folderPath = isRoot ? sourceSchemasBase('openapi') : path.join(sourceSchemasBase('openapi'), trimmed);

	if (!isRoot && (await ipcFsService.pathExists(folderPath)))
		throw new Error(`A folder named "${trimmed}" already exists in the project tree.`);

	if (input.seed.mode === 'url') {
		const outcome = await syncFromUrl({
			targetFolder: folderPath,
			url: input.seed.url,
			autoSync: input.seed.autoSync,
			intervalMinutes: input.seed.intervalMinutes,
			...(input.groupByPath ? { groupByPath: true } : {}),
		});
		if (!outcome.ok) throw new Error(outcome.error);
		return { folderPath, sync: outcome.result };
	}

	// file + paste both end up running the parser locally and calling
	// the openapi IPC directly — same code path, the seedMode + specPath
	// fields differ.
	const filename = input.seed.mode === 'file' ? input.seed.filename : undefined;
	const parsed = parseSpecSource(input.seed.source, filename);
	if (!parsed.ok) throw new Error(parsed.error);
	if (!looksLikeOpenApi3(parsed.spec))
		throw new Error('This file does not look like an OpenAPI 3.x document (missing `openapi: 3.x`).');

	const sync = await ipcOpenApiService.syncFromSpec({
		targetFolder: folderPath,
		spec: parsed.spec,
		seedMode: input.seed.mode,
		...(input.seed.mode === 'file' ? { specPath: input.seed.filename } : {}),
		...(input.groupByPath ? { groupByPath: true } : {}),
	});
	return { folderPath, sync };
}

export interface UpdateOpenApiInput {
	url?: string;
	autoSync?: boolean;
	intervalMinutes?: number;
}

/**
 * Mutate an openapi collection's URL + auto-sync settings in place. Used
 * by the endpoint dialog's edit branch when a URL-mode openapi source
 * needs its config tweaked. Re-validates against the collection schema
 * so a buggy patch can't corrupt the file.
 */
export async function updateOpenApiSourceSchema(folderPath: string, patch: UpdateOpenApiInput): Promise<void> {
	const collectionPath = path.join(folderPath, COLLECTION_FILENAME);
	const raw = await ipcFsService.readJson<unknown>(collectionPath);
	const parsed = collectionFileSchema.safeParse(raw);
	if (!parsed.success) throw new Error(`Collection at ${collectionPath} failed schema validation.`);
	if (parsed.data.source.type !== 'openapi')
		throw new Error(`Collection at ${collectionPath} is not an openapi source.`);

	const next: CollectionFile = {
		...parsed.data,
		source: {
			...parsed.data.source,
			...(patch.url !== undefined ? { specUrl: patch.url } : {}),
			...(patch.autoSync !== undefined ? { autoSync: patch.autoSync } : {}),
			...(patch.intervalMinutes !== undefined ? { intervalMinutes: patch.intervalMinutes } : {}),
		},
	};

	const revalidated = collectionFileSchema.safeParse(next);
	if (!revalidated.success) throw new Error('Updated collection failed schema validation.');

	await ipcFsService.writeJson(collectionPath, revalidated.data, { spaces: '\t' });
}

/**
 * Discovered gRPC services + methods live in a sidecar `_grpc.json` inside
 * the endpoint folder so the renderer can read them back on next launch
 * without re-hitting the network. `_`-prefixed filename keeps it out of
 * the regular tree (the fs-emitter ignores those — see `fs-emitter.ts`).
 */
const GRPC_DESCRIPTOR_FILENAME = '_grpc.json';

export interface PersistedGrpcDescriptor {
	discoveredAt: string;
	services: Array<{
		name: string;
		methods: Array<{
			name: string;
			requestType: string;
			responseType: string;
			requestStream: boolean;
			responseStream: boolean;
		}>;
	}>;
	/**
	 * Flat map of FQ message name → field list, persisted alongside the
	 * service shape so the Fields editor can render structured inputs
	 * without re-querying reflection. Optional for back-compat with
	 * sidecars written before the schema landed.
	 */
	messages?: Record<
		string,
		{
			name: string;
			fields: Array<{
				name: string;
				number: number;
				type: string;
				typeName: string;
				repeated: boolean;
				optional: boolean;
				oneofIndex?: number;
			}>;
			oneofs: string[];
		}
	>;
	enums?: Record<
		string,
		{
			name: string;
			values: Array<{ name: string; number: number }>;
		}
	>;
}

export async function writeGrpcDescriptor(folderPath: string, descriptor: PersistedGrpcDescriptor): Promise<void> {
	const fullPath = path.join(folderPath, GRPC_DESCRIPTOR_FILENAME);
	await ipcFsService.writeJson(fullPath, descriptor, { spaces: '\t' });
}

export async function readGrpcDescriptor(folderPath: string): Promise<PersistedGrpcDescriptor | null> {
	const fullPath = path.join(folderPath, GRPC_DESCRIPTOR_FILENAME);
	if (!(await ipcFsService.pathExists(fullPath))) return null;
	try {
		return await ipcFsService.readJson<PersistedGrpcDescriptor>(fullPath);
	} catch {
		// Corrupt or unreadable — fall through to "no descriptor known".
		return null;
	}
}

/**
 * Sync the on-disk method request files to match `services`. Each unary
 * method gets one request file named `<method>.json` carrying a
 * `body.type === 'grpc'` payload; streaming methods are skipped because
 * the request pane can't drive them yet. We preserve the existing file
 * (and crucially its `id` + last-edited `requestJson`) when a file with
 * the same name already exists — re-running Discover after the user
 * tweaked a request shouldn't nuke their work.
 *
 * Returns the request ids it owns post-sync so callers can stitch tabs /
 * recent lists against the same identifiers across reloads.
 */
export async function syncGrpcMethodRequestFiles(
	folderPath: string,
	services: PersistedGrpcDescriptor['services'],
): Promise<{ writtenPaths: string[]; ownedIds: string[] }> {
	const writtenPaths: string[] = [];
	const ownedIds: string[] = [];
	for (const svc of services) {
		for (const method of svc.methods) {
			if (method.requestStream || method.responseStream) continue;
			const fileName = `${method.name}.json`;
			const fullPath = path.join(folderPath, fileName);

			let existing: RequestNodeFile | null = null;
			if (await ipcFsService.pathExists(fullPath)) {
				try {
					existing = await ipcFsService.readJson<RequestNodeFile>(fullPath);
				} catch {
					// Corrupt file — overwrite below.
				}
			}

			const id = existing?.id ?? ksuid.generate('request').toString();
			const existingGrpc =
				existing && existing.body && existing.body.type === 'grpc'
					? (existing.body.payload as { service?: string; method?: string; requestJson?: string })
					: null;

			const request: RequestNodeFile = {
				id,
				verb: 'post',
				url: [''],
				query: {},
				headers: {},
				body: {
					type: 'grpc',
					payload: {
						service: svc.name,
						method: method.name,
						requestJson: existingGrpc?.requestJson ?? '{\n\t\n}',
					},
				},
				options: {
					followRedirects: false,
					decompressResponse: false,
					timeoutMs: 0,
					maxRedirects: 0,
				},
			};
			await ipcFsService.writeJson(fullPath, request, { spaces: '\t' });
			writtenPaths.push(fullPath);
			ownedIds.push(id);
		}
	}
	return { writtenPaths, ownedIds };
}
