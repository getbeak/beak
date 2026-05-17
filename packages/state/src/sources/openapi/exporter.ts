import type { VariableSet } from '@getbeak/types/variable-sets';

import type { CollectionFile, PathParameterEntry, RequestFile } from '../../schemas/beak-project';
import type { PropertyConstraints, ScalarPropertyType } from '../../schemas/request-schema';
import { generateValueIdent } from '../../variable-sets/types';
import type {
	OpenApiDocument,
	OpenApiOperation,
	OpenApiParameter,
	OpenApiPathItem,
	OpenApiSchema,
	OpenApiServer,
} from './types';

export interface ExportOptions {
	/** OpenAPI `info.title`. Defaults to `'Beak Export'`. */
	title?: string;
	/** OpenAPI `info.version`. Defaults to `'1.0.0'`. */
	version?: string;
	/** OpenAPI `info.description`. Optional. */
	description?: string;
	/**
	 * Variable set whose `baseUrl` items will be lifted into `servers[]`. Optional.
	 * When the collection's `defaults.baseUrl` points at a variable-set item, we
	 * look up the value for each set (Production / Staging / …) and emit one
	 * server per set. When omitted, the exporter falls back to inlining the
	 * literal-string parts of the baseUrl (best effort).
	 */
	variableSet?: VariableSet | null;
}

export interface OpenApiExportResult {
	document: OpenApiDocument;
	warnings: string[];
}

/**
 * Reverse of {@link openapiToCollection}: take a collection + concrete request
 * files and synthesise an OpenAPI 3.0 document. Pure — no I/O.
 *
 * Per-request, the exporter:
 *  - Reverses `:name` path placeholders back to `{name}`.
 *  - Splits the request's URL into the path portion (after the baseUrl prefix
 *    if one is shared) — anything that can't be cleanly stripped emits a
 *    warning and the full URL goes onto the operation.
 *  - Reconstructs parameters with the schema we carried under
 *    `headers[*].constraints` / `query[*].constraints` / `pathParameters[*].constraints`.
 *  - Maps `type: 'token'` headers back to `schema.format = 'password'` so a
 *    consumer of the exported spec sees the credential signal.
 *  - Emits the body's content example when present.
 *
 * Body schema reversal is best-effort: JSON-entries → `schema.example` rather
 * than a full structural schema. The original spec — if available — is the
 * canonical source for that; the exporter is for snapshotting what Beak knows.
 */
export function collectionToOpenapi(
	collection: CollectionFile,
	requests: RequestFile[],
	options: ExportOptions = {},
): OpenApiExportResult {
	const warnings: string[] = [];
	const servers = resolveServers(collection, options.variableSet ?? null, warnings);
	const baseUrlPath = stripCommonBasePath(servers);
	const paths: NonNullable<OpenApiDocument['paths']> = {};

	for (const req of requests) {
		const url = stringifyUrl(req.url, warnings, req._provenance?.operationId);
		if (url === null) continue;
		const operationPath = derivePath(url, baseUrlPath);
		const method = req.verb.toLowerCase();
		if (!isHttpMethod(method)) {
			warnings.push(`Skipping request '${req.id}' — verb '${req.verb}' is not a standard HTTP method.`);
			continue;
		}

		const operation: OpenApiOperation = {};
		if (req._provenance?.operationId) operation.operationId = req._provenance.operationId;

		const parameters = buildParameters(req);
		if (parameters.length > 0) operation.parameters = parameters;

		const body = buildRequestBody(req);
		if (body) operation.requestBody = body;

		const item: OpenApiPathItem = paths[operationPath] ?? {};
		// Discriminated union of method keys — TS can't narrow this on its own.
		(item as Record<string, OpenApiOperation>)[method] = operation;
		paths[operationPath] = item;
	}

	const document: OpenApiDocument = {
		openapi: '3.0.3',
		info: {
			title: options.title ?? 'Beak Export',
			version: options.version ?? '1.0.0',
			...(options.description ? { description: options.description } : {}),
		},
		...(servers.length > 0 ? { servers } : {}),
		paths,
	};

	return { document, warnings };
}

// ─── URL → path reconstruction ──────────────────────────────────────────

const HTTP_METHODS_SET = new Set(['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace']);

function isHttpMethod(verb: string): boolean {
	return HTTP_METHODS_SET.has(verb);
}

/**
 * Convert a request's URL value-parts back into a flat path string. Variable
 * parts that aren't literal strings produce a warning and contribute their
 * `type` name as a `{placeholder}` so the export at least surfaces where the
 * dynamic chunks lived — better than silently dropping them.
 */
function stringifyUrl(
	parts: unknown,
	warnings: string[],
	operationId: string | undefined,
): string | null {
	if (!Array.isArray(parts)) return null;
	const out: string[] = [];
	for (const part of parts) {
		if (typeof part === 'string') {
			out.push(part);
			continue;
		}
		if (part && typeof part === 'object' && 'type' in part) {
			const t = String((part as { type: unknown }).type);
			warnings.push(
				`${operationId ?? 'request'}: URL contains a non-literal value-part (${t}) — emitted as placeholder.`,
			);
			out.push(`{${t}}`);
		}
	}
	const joined = out.join('').trim();
	return joined.length > 0 ? joined : null;
}

/**
 * Replace `:name` placeholders with OpenAPI's `{name}` form, and slice off
 * a shared baseUrl prefix when one is provided. Leading slash is preserved.
 */
function derivePath(url: string, baseUrlPath: string | null): string {
	let path = url;
	if (baseUrlPath && path.startsWith(baseUrlPath)) {
		path = path.slice(baseUrlPath.length);
	}
	path = path.replace(/:([a-zA-Z_][a-zA-Z0-9_-]*)/g, '{$1}');
	if (!path.startsWith('/')) path = `/${path}`;
	return path;
}

/**
 * Of the resolved servers, find the longest shared URL path suffix so we can
 * strip it from each request's URL when building per-operation paths.
 * Returns `null` when there are no servers or the servers disagree on path.
 */
function stripCommonBasePath(servers: OpenApiServer[]): string | null {
	if (servers.length === 0) return null;
	let path: string | null = null;
	for (const server of servers) {
		try {
			const p = new URL(server.url).pathname.replace(/\/$/, '');
			if (path === null) path = p;
			else if (p !== path) return null;
		} catch {
			return null;
		}
	}
	return path && path.length > 0 ? path : null;
}

// ─── Parameters ─────────────────────────────────────────────────────────

function buildParameters(req: RequestFile): OpenApiParameter[] {
	const out: OpenApiParameter[] = [];
	const query = (req.query as Record<string, unknown> | undefined) ?? {};
	for (const [name, entry] of Object.entries(query)) {
		out.push(scalarEntryToParameter(name, entry, 'query'));
	}
	const headers = (req.headers as Record<string, unknown> | undefined) ?? {};
	for (const [name, entry] of Object.entries(headers)) {
		out.push(scalarEntryToParameter(name, entry, 'header'));
	}
	const pathParams = (req.pathParameters as Record<string, unknown> | undefined) ?? {};
	for (const [name, entry] of Object.entries(pathParams)) {
		out.push(pathEntryToParameter(name, entry));
	}
	return out;
}

interface ScalarLike {
	type?: ScalarPropertyType;
	required?: boolean;
	description?: string;
	options?: string[];
	constraints?: PropertyConstraints;
}

function scalarEntryToParameter(
	name: string,
	entry: unknown,
	location: 'query' | 'header',
): OpenApiParameter {
	const e = (entry ?? {}) as ScalarLike;
	const schema = entryToSchema(e);
	const param: OpenApiParameter = { name, in: location };
	if (e.required) param.required = true;
	if (e.description) param.description = e.description;
	if (schema) param.schema = schema;
	return param;
}

function pathEntryToParameter(name: string, entry: unknown): OpenApiParameter {
	const e = (entry ?? {}) as Partial<PathParameterEntry> & ScalarLike;
	const schema = entryToSchema(e);
	// Path parameters are required by URL structure — always emit `required: true`.
	const param: OpenApiParameter = { name, in: 'path', required: true };
	if (e.description) param.description = e.description;
	if (schema) param.schema = schema;
	return param;
}

/**
 * Re-assemble an OpenAPI schema fragment from a Beak parameter entry. Returns
 * `undefined` when the entry carries no schema-flavoured fields — keeps the
 * exported spec sparse for parameters the user never described.
 */
function entryToSchema(entry: ScalarLike): OpenApiSchema | undefined {
	const out: OpenApiSchema = {};
	const t = entry.type;
	switch (t) {
		case 'number':
			out.type = entry.constraints?.integer ? 'integer' : 'number';
			break;
		case 'boolean':
			out.type = 'boolean';
			break;
		case 'enum':
			out.type = 'string';
			break;
		case 'token':
			out.type = 'string';
			out.format = 'password';
			break;
		// 'string' and undefined both default to omitting `type` (string is OpenAPI's
		// implicit default).
		default:
			break;
	}
	if (entry.options && entry.options.length > 0) out.enum = [...entry.options];
	const c = entry.constraints;
	if (c) {
		// `format` from the entry's known-format set. The `password` format is
		// the token signal — only emit a format here if we didn't already mark
		// the entry as `token` above (which already wrote the format).
		if (c.format && !out.format) out.format = c.format;
		if (c.pattern) out.pattern = c.pattern;
		if (typeof c.minLength === 'number') out.minLength = c.minLength;
		if (typeof c.maxLength === 'number') out.maxLength = c.maxLength;
		if (typeof c.min === 'number') out.minimum = c.min;
		if (typeof c.max === 'number') out.maximum = c.max;
	}
	return Object.keys(out).length > 0 ? out : undefined;
}

// ─── Body ───────────────────────────────────────────────────────────────

function buildRequestBody(req: RequestFile): OpenApiOperation['requestBody'] {
	const body = req.body;
	if (!body) return undefined;
	switch (body.type) {
		case 'text': {
			if (typeof body.payload === 'string' && body.payload.length > 0) {
				return { content: { 'text/plain': { schema: { example: body.payload } } } };
			}
			return undefined;
		}
		case 'json':
		case 'json_raw': {
			// Best-effort — the structural reversal of `payload` (an EntryMap) back
			// to a JSON Schema is non-trivial and the original spec is the
			// canonical source if it exists. Emit an example placeholder so a
			// downstream consumer sees the body is JSON-shaped.
			return { content: { 'application/json': { schema: { type: 'object' } } } };
		}
		case 'url_encoded_form': {
			return { content: { 'application/x-www-form-urlencoded': { schema: { type: 'object' } } } };
		}
		case 'graphql': {
			return { content: { 'application/json': { schema: { type: 'object' } } } };
		}
		case 'grpc':
		case 'file':
			// gRPC + binary bodies have no clean OpenAPI representation — leave them off.
			return undefined;
		default:
			return undefined;
	}
}

// ─── Servers ─────────────────────────────────────────────────────────────

/**
 * Resolve the `servers[]` block from the collection's `defaults.baseUrl`.
 *
 *  - If the baseUrl is a single `variable_set_item` reference and the caller
 *    provided the variable set, emit one server per set (Production /
 *    Staging / …), labelled with the set's display name.
 *  - If the baseUrl is literal text, emit a single server with that URL.
 *  - Otherwise (mixed parts, no variable set, no baseUrl), emit no servers
 *    and warn.
 */
function resolveServers(
	collection: CollectionFile,
	variableSet: VariableSet | null,
	warnings: string[],
): OpenApiServer[] {
	const baseUrl = collection.defaults?.baseUrl as unknown;
	if (!Array.isArray(baseUrl) || baseUrl.length === 0) return [];

	if (baseUrl.length === 1) {
		const part = baseUrl[0];
		if (typeof part === 'string' && part.length > 0) {
			return [{ url: part }];
		}
		if (
			typeof part === 'object' &&
			part !== null &&
			'type' in part &&
			(part as { type: string }).type === 'variable_set_item'
		) {
			if (!variableSet) {
				warnings.push('Collection baseUrl references a variable-set item but no variable set was supplied — servers will be empty.');
				return [];
			}
			const itemId = (part as { payload?: { itemId?: string } }).payload?.itemId;
			if (!itemId) return [];
			return resolveServersFromVariableSet(itemId, variableSet, warnings);
		}
	}

	// Mixed value-parts (literal + variables) — flatten by collecting only the
	// literal parts. Useful for human inspection but probably broken as a real
	// server URL; emit a warning.
	const flat = baseUrl
		.map((p: unknown) => (typeof p === 'string' ? p : ''))
		.join('')
		.trim();
	if (flat.length > 0) {
		warnings.push('Collection baseUrl mixed literal + variable parts — exported as a flattened best-effort.');
		return [{ url: flat }];
	}
	return [];
}

function resolveServersFromVariableSet(
	itemId: string,
	set: VariableSet,
	warnings: string[],
): OpenApiServer[] {
	const itemName = set.items[itemId];
	if (itemName === undefined) {
		warnings.push(`Variable set has no item with id '${itemId}' — servers will be empty.`);
		return [];
	}
	const servers: OpenApiServer[] = [];
	for (const [setId, setName] of Object.entries(set.sets)) {
		const value = set.values[generateValueIdent(setId, itemId)] as unknown;
		if (!Array.isArray(value)) continue;
		const url = value
			.map((v: unknown) => (typeof v === 'string' ? v : ''))
			.join('')
			.trim();
		if (url.length === 0) continue;
		servers.push({ url, description: setName });
	}
	return servers;
}
