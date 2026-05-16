import ksuid from '@beak/ksuid';
import type { VariableSet } from '@getbeak/types/variable-sets';

import type {
	CollectionFile,
	RequestFileOverride,
} from '../../schemas/beak-project';
import { generateValueIdent } from '../../variable-sets/types';
import {
	HTTP_METHODS,
	type HttpMethod,
	type OpenApiDocument,
	type OpenApiOperation,
	type OpenApiParameter,
	type OpenApiPathItem,
	type OpenApiReference,
	type OpenApiServer,
} from './types';

export interface OpenApiConversionResult {
	collection: CollectionFile;
	requests: ConvertedRequest[];
	/**
	 * Variable set proposed by the converter when the spec declares
	 * `servers`. The collection's `defaults.baseUrl` is a reference into this
	 * variable set's `baseUrl` item; the user picks which server (set) is
	 * active from the variable-set picker. `null` when the spec has no
	 * servers — the collection then carries no `baseUrl` default at all and
	 * each request file declares its full URL.
	 */
	variableSet: ProposedVariableSet | null;
	warnings: string[];
}

export interface ProposedVariableSet {
	name: string;
	set: VariableSet;
	/**
	 * Map from semantic label (e.g. `baseUrl`, `apiKey`) to the item id used
	 * inside `set`. The writer / merger consults this when rewriting
	 * value-part references in the collection so they point at the merged
	 * variable set's item ids instead of the converter's local ones.
	 */
	items: Record<string, string>;
}

export interface ConvertedRequest {
	/** Suggested file name (without extension), e.g. "listUsers" or "GET-users-id". */
	suggestedName: string;
	/**
	 * Sub-folder (forward-slash separated, no leading/trailing slash) the
	 * writer should drop this request into, relative to the import target.
	 * Empty / undefined → write at the target folder root. Populated only
	 * when `ConvertOptions.groupByPath` is set; URL parameter segments
	 * (`{userId}`) are stripped so the resulting folder names are
	 * filesystem-friendly and stable across re-syncs.
	 */
	folder?: string;
	override: RequestFileOverride;
}

export interface ConvertOptions {
	/**
	 * Seed mode: `url` for remote-spec sources, `file` for local-file sources,
	 * `paste` for one-shot literal text. Determines which re-sync surface the
	 * sidebar exposes and which warning banner the request pane renders.
	 */
	seedMode?: 'url' | 'file' | 'paste';
	/** Path relative to the project that the spec file was written to. */
	specPath?: string;
	/** Remote spec URL. */
	specUrl?: string;
	/** Pass-through to the collection's source.autoSync — sidebar toggles this. */
	autoSync?: boolean;
	/** Pass-through to the collection's source.intervalMinutes. */
	intervalMinutes?: number;
	/** Name of the proposed Environments variable set. Defaults to 'Environments'. */
	variableSetName?: string;
	/**
	 * Opt-in heuristic: derive a sub-folder per request from its URL path, so
	 * `/api/agents/{id}/posts` writes to `api/agents/posts/<operationId>.json`
	 * instead of dumping everything in one flat folder. Parameter segments
	 * (`{userId}`) are stripped from the folder path so names stay
	 * filesystem-clean; the operationId-based filename still disambiguates
	 * operations on the same effective path. Pure mapping — same spec
	 * always produces the same layout, so re-syncs are stable.
	 */
	groupByPath?: boolean;
	/** Override the timestamp (test injection). Defaults to `new Date().toISOString()`. */
	now?: () => string;
	/** Stable id generator (test injection). Defaults to a deterministic per-operation id. */
	makeId?: (operationId: string, index: number) => string;
	/** Stable set-id generator (test injection). Defaults to a ksuid per call. */
	makeSetId?: (description: string, index: number) => string;
	/** Stable item-id generator (test injection). Defaults to a ksuid per call. */
	makeItemId?: (name: string) => string;
}

/**
 * Convert an OpenAPI 3.x document into a Beak collection + a list of request
 * overrides. The collection carries the spec's first `servers[].url` as the
 * collection's `baseUrl` default. Each operation becomes a sparse request
 * override that lists only the fields that differ from the collection's
 * defaults — typically `verb`, the path-portion of `url`, and per-operation
 * query/header parameters.
 *
 * Pure function: no I/O, no `Date.now()` unless `options.now` is omitted.
 */
export function openapiToCollection(
	spec: OpenApiDocument,
	options: ConvertOptions = {},
): OpenApiConversionResult {
	const warnings: string[] = [];
	const now = options.now ?? (() => new Date().toISOString());
	const syncedAt = now();
	const makeId = options.makeId ?? defaultIdGen;
	const makeSetId = options.makeSetId ?? (() => ksuid.generate('set').toString());
	const makeItemId = options.makeItemId ?? (() => ksuid.generate('item').toString());

	if (!spec.openapi?.startsWith('3.')) {
		warnings.push(`Unsupported OpenAPI version '${spec.openapi}' — converter is tested against 3.x.`);
	}

	const servers = spec.servers ?? [];
	if (servers.length === 0) {
		warnings.push('Spec has no `servers` entry — collection baseUrl will be empty.');
	}

	// Build the proposed variable set first. When the spec declares servers,
	// the collection's `baseUrl` default becomes a reference into this set
	// (the user picks which server is active); the writer merges this into
	// any existing variable set with the same name so multi-spec projects
	// share one Environments file.
	const variableSet: ProposedVariableSet | null = buildProposedVariableSet(servers, {
		name: options.variableSetName ?? 'Environments',
		makeSetId,
		makeItemId,
	});

	const baseUrlItemId = variableSet?.items.baseUrl;
	const baseUrlPart = baseUrlItemId ? { type: 'variable_set_item', payload: { itemId: baseUrlItemId } } : null;

	const collection: CollectionFile = {
		source: {
			type: 'openapi',
			...(options.seedMode ? { seedMode: options.seedMode } : {}),
			...(options.specPath ? { specPath: options.specPath } : {}),
			...(options.specUrl ? { specUrl: options.specUrl } : {}),
			lastSyncedAt: syncedAt,
			...(options.autoSync ? { autoSync: true } : {}),
			...(options.intervalMinutes ? { intervalMinutes: options.intervalMinutes } : {}),
		},
		...(baseUrlPart ? { defaults: { baseUrl: [baseUrlPart] } } : {}),
	};

	const requests: ConvertedRequest[] = [];
	const paths = spec.paths ?? {};
	let operationIndex = 0;

	for (const [pathPattern, pathItem] of Object.entries(paths)) {
		if (!pathItem) continue;
		for (const method of HTTP_METHODS) {
			const op = pathItem[method];
			if (!op) continue;

			const opId = op.operationId ?? buildFallbackOperationId(method, pathPattern);
			if (!op.operationId) {
				warnings.push(`No operationId for ${method.toUpperCase()} ${pathPattern} — falling back to '${opId}'.`);
			}

			const override = buildRequestOverride({
				id: makeId(opId, operationIndex),
				operationId: opId,
				method,
				pathPattern,
				pathItem,
				operation: op,
				warnings,
				spec,
			});
			override._provenance = {
				source: 'openapi',
				linked: true,
				operationId: opId,
				syncedAt,
			};

			const folder = options.groupByPath ? derivePathFolder(pathPattern) : undefined;

			requests.push({
				suggestedName: opId,
				...(folder ? { folder } : {}),
				override,
			});
			operationIndex += 1;
		}
	}

	return { collection, requests, variableSet, warnings };
}

// ─── Variable-set merger ────────────────────────────────────────────────
// Lives next to the converter (rather than its own module) because the
// dev server's resolver doesn't always notice newly-added files mid-
// session — having one fewer file to import keeps HMR happy.

export interface VariableSetMergeResult {
	/**
	 * The merged variable set ready to be written to disk. `null` means the
	 * writer should not create or touch a variable-set file (no proposal,
	 * no existing file).
	 */
	merged: VariableSet | null;
	/**
	 * Final item-id remapping for the proposed set's items. Keys are the
	 * converter's *semantic labels* (`baseUrl`, `apiKey`, …); values are the
	 * item ids inside `merged` that the writer should substitute into the
	 * collection's value-part references. The merger always normalises to
	 * the canonical ids of the existing file (or the new file).
	 */
	itemIdByLabel: Record<string, string>;
}

/**
 * Fold a converter-emitted variable set into an existing on-disk variable
 * set (if any), namespacing items by `folderName` so multiple specs in the
 * same project share an Environments file without colliding on common
 * variable names.
 *
 * Pure — no I/O. The IPC layer reads the existing set and writes the
 * merged one back.
 *
 * Rules:
 *  - **Sets are reused by display name**: a proposed `Production` set folds
 *    into an existing set called `Production`.
 *  - **Items are namespaced by folder**: proposed item `baseUrl` becomes
 *    `<folderName>.baseUrl`. Re-imports into the same folder reuse the
 *    existing namespaced item (so its id is stable across syncs).
 *  - **Values write through to the resolved (setId, itemId) pair.** Re-sync
 *    overwrites existing values; values for items / sets the spec didn't
 *    touch are preserved.
 */
export function mergeProposedVariableSet(
	existing: VariableSet | null,
	proposed: ProposedVariableSet | null,
	folderName: string,
): VariableSetMergeResult {
	if (!proposed) {
		return { merged: existing, itemIdByLabel: {} };
	}

	const merged: VariableSet = existing
		? {
				sets: { ...existing.sets },
				items: { ...existing.items },
				values: { ...existing.values },
			}
		: { sets: {}, items: {}, values: {} };

	const existingSetIdByName = new Map<string, string>();
	for (const [setId, name] of Object.entries(merged.sets)) {
		existingSetIdByName.set(name, setId);
	}

	const proposedSetIdToMerged = new Map<string, string>();
	for (const [proposedSetId, name] of Object.entries(proposed.set.sets)) {
		const existingId = existingSetIdByName.get(name);
		if (existingId !== undefined) {
			proposedSetIdToMerged.set(proposedSetId, existingId);
		} else {
			merged.sets[proposedSetId] = name;
			proposedSetIdToMerged.set(proposedSetId, proposedSetId);
		}
	}

	const existingItemIdByName = new Map<string, string>();
	for (const [itemId, name] of Object.entries(merged.items)) {
		existingItemIdByName.set(name, itemId);
	}

	const proposedItemIdToMerged = new Map<string, string>();
	const itemIdByLabel: Record<string, string> = {};
	for (const [proposedItemId, label] of Object.entries(proposed.set.items)) {
		const namespaced = `${folderName}.${label}`;
		const existingId = existingItemIdByName.get(namespaced);
		if (existingId !== undefined) {
			proposedItemIdToMerged.set(proposedItemId, existingId);
			itemIdByLabel[label] = existingId;
		} else {
			merged.items[proposedItemId] = namespaced;
			proposedItemIdToMerged.set(proposedItemId, proposedItemId);
			itemIdByLabel[label] = proposedItemId;
		}
	}

	// Mirror the converter's label→proposedItemId mapping so callers that
	// asked for the `baseUrl` label get the right merged item id even when
	// sets/items were renamed mid-flight.
	for (const [label, proposedItemId] of Object.entries(proposed.items)) {
		const resolved = proposedItemIdToMerged.get(proposedItemId);
		if (resolved !== undefined) itemIdByLabel[label] = resolved;
	}

	for (const [proposedIdent, value] of Object.entries(proposed.set.values)) {
		const [proposedSetId, proposedItemId] = proposedIdent.split('&');
		if (!proposedSetId || !proposedItemId) continue;
		const setId = proposedSetIdToMerged.get(proposedSetId);
		const itemId = proposedItemIdToMerged.get(proposedItemId);
		if (!setId || !itemId) continue;
		merged.values[generateValueIdent(setId, itemId)] = value;
	}

	return { merged, itemIdByLabel };
}

interface BuildVariableSetArgs {
	name: string;
	makeSetId: (description: string, index: number) => string;
	makeItemId: (name: string) => string;
}

/**
 * Build a candidate variable set from the spec's `servers[]`. Each server
 * becomes a *set* (Production / Staging / …) keyed off `description` (or a
 * sanitised host fallback); one `baseUrl` *item* holds the URL value per
 * set. The merger upstream namespaces the item by folder name and reuses
 * sets with matching display names so multi-spec projects share a single
 * Environments file.
 */
function buildProposedVariableSet(
	servers: OpenApiServer[],
	args: BuildVariableSetArgs,
): ProposedVariableSet | null {
	if (servers.length === 0) return null;

	const sets: Record<string, string> = {};
	const setIds: string[] = [];
	servers.forEach((server, index) => {
		const display = server.description?.trim() || hostFromUrl(server.url) || `Server ${index + 1}`;
		const setId = args.makeSetId(display, index);
		sets[setId] = display;
		setIds.push(setId);
	});

	const baseUrlItemId = args.makeItemId('baseUrl');
	const items: Record<string, string> = { [baseUrlItemId]: 'baseUrl' };

	const values: Record<string, Array<string>> = {};
	servers.forEach((server, index) => {
		const setId = setIds[index]!;
		values[generateValueIdent(setId, baseUrlItemId)] = [server.url];
	});

	return {
		name: args.name,
		set: { sets, items, values: values as VariableSet['values'] },
		items: { baseUrl: baseUrlItemId },
	};
}

function hostFromUrl(url: string): string | undefined {
	try {
		return new URL(url).host;
	} catch {
		return undefined;
	}
}

/**
 * Project an OpenAPI path pattern onto a forward-slash folder path,
 * stripping parameter segments (`{userId}`) so the resulting folder names
 * stay filesystem-friendly. Parameter-only paths and the root path return
 * the empty string — the writer treats that as "write at the import target
 * with no extra nesting".
 *
 * Pure and deterministic by construction: the path string fully determines
 * the output, so re-syncs land each operation in the same folder every time.
 */
export function derivePathFolder(pathPattern: string): string {
	return pathPattern
		.split('/')
		.map(seg => seg.trim())
		.filter(seg => seg.length > 0 && !/^\{.+\}$/.test(seg))
		.map(seg => sanitiseFolderSegment(seg))
		.filter(seg => seg.length > 0)
		.join('/');
}

function sanitiseFolderSegment(segment: string): string {
	return segment
		.replace(/[\\/:*?"<>|]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^[.-]+|[.-]+$/g, '')
		.slice(0, 80);
}

function buildFallbackOperationId(method: HttpMethod, pathPattern: string): string {
	const sanitised = pathPattern
		.replace(/^\//, '')
		.replace(/[{}]/g, '')
		.replace(/[^a-zA-Z0-9]/g, '-')
		.replace(/-+/g, '-')
		.replace(/-$/, '');
	return `${method}-${sanitised || 'root'}`;
}

interface BuildOverrideArgs {
	id: string;
	operationId: string;
	method: HttpMethod;
	pathPattern: string;
	pathItem: OpenApiPathItem;
	operation: OpenApiOperation;
	warnings: string[];
	spec: OpenApiDocument;
}

function buildRequestOverride({
	id,
	operationId,
	method,
	pathPattern,
	pathItem,
	operation,
	warnings,
	spec,
}: BuildOverrideArgs): RequestFileOverride {
	const allParams = collectParameters(pathItem, operation, warnings, spec);
	const queryParams = allParams.filter(p => p.in === 'query');
	const headerParams = allParams.filter(p => p.in === 'header');
	const pathParams = allParams.filter(p => p.in === 'path');

	const url = renderPath(pathPattern, pathParams);

	const override: RequestFileOverride = {
		id,
		operationId,
		// Storage convention is lowercase — display layers uppercase on render.
		verb: method.toLowerCase(),
		url: [url],
	};

	if (queryParams.length > 0) {
		override.query = paramsToRecord(queryParams);
	}
	if (headerParams.length > 0) {
		override.headers = paramsToRecord(headerParams);
	}

	// Always seed a body, even for bodyless verbs (GET/DELETE). The request
	// pane + flight machinery assume `info.body` is present — reading
	// `body.type` on undefined throws — and every other place that
	// constructs a request file in this codebase honours the same invariant.
	override.body = operation.requestBody
		? bodyFromRequestBody(operation.requestBody) ?? { type: 'text', payload: '' }
		: { type: 'text', payload: '' };

	return override;
}

function collectParameters(
	pathItem: OpenApiPathItem,
	operation: OpenApiOperation,
	warnings: string[],
	spec?: OpenApiDocument,
): OpenApiParameter[] {
	const out: OpenApiParameter[] = [];
	const sources: (OpenApiParameter | OpenApiReference)[] = [
		...(pathItem.parameters ?? []),
		...(operation.parameters ?? []),
	];
	for (const p of sources) {
		if ('$ref' in p) {
			const resolved = resolveParameterRef(p.$ref, spec, warnings);
			if (resolved) out.push(resolved);
			continue;
		}
		out.push(p);
	}
	return out;
}

/**
 * Resolve a `$ref` of the form `#/components/parameters/<name>`. Only the
 * local intra-document form is supported — external `$ref` URLs would need
 * network fetching and a JSON-pointer resolver, which is out of scope for
 * the converter today.
 */
function resolveParameterRef(
	ref: string,
	spec: OpenApiDocument | undefined,
	warnings: string[],
): OpenApiParameter | null {
	if (!spec) {
		warnings.push(`Cannot resolve $ref '${ref}' — converter was called without the document context.`);
		return null;
	}
	const match = ref.match(/^#\/components\/parameters\/(.+)$/);
	if (!match) {
		warnings.push(`Skipping unsupported $ref '${ref}' — only #/components/parameters/* is resolved.`);
		return null;
	}
	const name = match[1];
	const param = spec.components?.parameters?.[name];
	if (!param) {
		warnings.push(`Dangling $ref '${ref}' — no parameter declared at that path.`);
		return null;
	}
	return param;
}

function renderPath(pathPattern: string, pathParams: OpenApiParameter[]): string {
	if (pathParams.length === 0) return pathPattern;
	// Map {paramName} → :paramName so users can spot path placeholders. We don't
	// embed defaults here because path parameters are required and meant to be
	// edited per-flight.
	let rendered = pathPattern;
	for (const p of pathParams) {
		rendered = rendered.replace(`{${p.name}}`, `:${p.name}`);
	}
	return rendered;
}

type ScalarPropertyType = 'string' | 'number' | 'boolean' | 'enum' | 'token';

/**
 * Map an OpenAPI parameter schema's type onto Beak's scalar property type.
 * `string` is the implicit default and is omitted from the output so we
 * don't pollute every header with `type: 'string'`. `integer`/`number`
 * collapse to `number`. `enum`-bearing schemas override the base type so
 * the value editor can render a dropdown.
 */
function scalarTypeFromSchema(schema: OpenApiParameter['schema']): ScalarPropertyType | undefined {
	if (!schema) return undefined;
	if (schema.enum && schema.enum.length > 0) return 'enum';
	switch (schema.type) {
		case 'integer':
		case 'number':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'string':
		case undefined:
			return undefined;
		default:
			return undefined;
	}
}

/**
 * Header names that imply a credential — we tag these as `token` so the
 * value editor masks their plaintext, even if the spec didn't declare a
 * format. Match is case-insensitive and limited to well-known scheme names
 * to avoid false positives.
 */
const TOKEN_HEADER_PATTERN = /^(authorization|x-api-key|x-auth-token|api-key|apikey)$/i;

function paramsToRecord(params: OpenApiParameter[]): NonNullable<RequestFileOverride['query']> {
	const out: Record<
		string,
		{
			name: string;
			value: [string];
			enabled: boolean;
			type?: ScalarPropertyType;
			required?: boolean;
			description?: string;
			options?: string[];
		}
	> = {};
	for (const p of params) {
		const exampleValue = stringifyExample(p.schema);
		const required = p.required === true;
		const inferredType = scalarTypeFromSchema(p.schema);
		const isTokenHeader = p.in === 'header' && TOKEN_HEADER_PATTERN.test(p.name);
		const schemaType: ScalarPropertyType | undefined = isTokenHeader ? 'token' : inferredType;
		// Carry enum members across so Value mode renders a dropdown rather
		// than free text. We coerce every option to a string — OpenAPI allows
		// numeric / boolean enums but the value editor stores strings on the
		// wire either way.
		const enumOptions =
			schemaType === 'enum' && Array.isArray(p.schema?.enum) ? p.schema!.enum!.map(v => String(v)) : undefined;

		out[p.name] = {
			name: p.name,
			value: [exampleValue],
			enabled: required,
			...(schemaType ? { type: schemaType } : {}),
			...(required ? { required: true } : {}),
			...(p.description ? { description: p.description } : {}),
			...(enumOptions && enumOptions.length > 0 ? { options: enumOptions } : {}),
		};
	}
	return out;
}

function stringifyExample(schema: OpenApiParameter['schema']): string {
	if (!schema) return '';
	if (schema.example !== undefined) return String(schema.example);
	if (schema.default !== undefined) return String(schema.default);
	if (schema.enum && schema.enum.length > 0) return String(schema.enum[0]);
	return '';
}

function bodyFromRequestBody(
	requestBody: OpenApiOperation['requestBody'],
): RequestFileOverride['body'] {
	if (!requestBody || '$ref' in requestBody) return undefined;
	const content = requestBody.content ?? {};
	const mediaTypes = Object.keys(content);
	if (mediaTypes.length === 0) return undefined;
	const jsonType = mediaTypes.find(t => t.includes('json')) ?? mediaTypes[0];
	const schema = content[jsonType]?.schema;
	const example = schema?.example;

	if (jsonType.includes('json')) {
		const payload = example !== undefined ? prettyJson(example) : '{\n}';
		return { type: 'text', payload };
	}

	return { type: 'text', payload: example !== undefined ? String(example) : '' };
}

function prettyJson(value: unknown): string {
	try {
		return JSON.stringify(value, null, '\t');
	} catch {
		return '';
	}
}

function defaultIdGen(operationId: string, index: number): string {
	return `${operationId}-${index.toString(16).padStart(4, '0')}`;
}
