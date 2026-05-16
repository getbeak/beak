import type {
	CollectionFile,
	RequestFileOverride,
} from '../../schemas/beak-project';
import {
	HTTP_METHODS,
	type HttpMethod,
	type OpenApiDocument,
	type OpenApiOperation,
	type OpenApiParameter,
	type OpenApiPathItem,
	type OpenApiReference,
} from './types';

export interface OpenApiConversionResult {
	collection: CollectionFile;
	requests: ConvertedRequest[];
	warnings: string[];
}

export interface ConvertedRequest {
	/** Suggested file name (without extension), e.g. "listUsers" or "GET-users-id". */
	suggestedName: string;
	override: RequestFileOverride;
}

export interface ConvertOptions {
	/** Path relative to the project that the spec file was written to. */
	specPath?: string;
	/** Remote spec URL. */
	specUrl?: string;
	/** Pass-through to the collection's source.autoSync — Project Home toggles this. */
	autoSync?: boolean;
	/** Pass-through to the collection's source.intervalMinutes. */
	intervalMinutes?: number;
	/** Override the timestamp (test injection). Defaults to `new Date().toISOString()`. */
	now?: () => string;
	/** Stable id generator (test injection). Defaults to a deterministic per-operation id. */
	makeId?: (operationId: string, index: number) => string;
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
	const makeId = options.makeId ?? defaultIdGen;

	if (!spec.openapi?.startsWith('3.')) {
		warnings.push(`Unsupported OpenAPI version '${spec.openapi}' — converter is tested against 3.x.`);
	}

	const baseUrl = pickBaseUrl(spec, warnings);

	const collection: CollectionFile = {
		source: {
			type: 'openapi',
			...(options.specPath ? { specPath: options.specPath } : {}),
			...(options.specUrl ? { specUrl: options.specUrl } : {}),
			lastSyncedAt: now(),
			...(options.autoSync ? { autoSync: true } : {}),
			...(options.intervalMinutes ? { intervalMinutes: options.intervalMinutes } : {}),
		},
		...(baseUrl ? { defaults: { baseUrl: [baseUrl] } } : {}),
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

			requests.push({
				suggestedName: opId,
				override,
			});
			operationIndex += 1;
		}
	}

	return { collection, requests, warnings };
}

function pickBaseUrl(spec: OpenApiDocument, warnings: string[]): string | undefined {
	const servers = spec.servers ?? [];
	if (servers.length === 0) {
		warnings.push('Spec has no `servers` entry — collection baseUrl will be empty.');
		return undefined;
	}
	if (servers.length > 1) {
		warnings.push(`Spec has ${servers.length} server entries — using the first ('${servers[0].url}').`);
	}
	return servers[0].url;
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

	if (operation.requestBody) {
		const body = bodyFromRequestBody(operation.requestBody);
		if (body) override.body = body;
	}

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
		}
	> = {};
	for (const p of params) {
		const exampleValue = stringifyExample(p.schema);
		const required = p.required === true;
		const inferredType = scalarTypeFromSchema(p.schema);
		const isTokenHeader = p.in === 'header' && TOKEN_HEADER_PATTERN.test(p.name);
		const schemaType: ScalarPropertyType | undefined = isTokenHeader ? 'token' : inferredType;

		out[p.name] = {
			name: p.name,
			value: [exampleValue],
			enabled: required,
			...(schemaType ? { type: schemaType } : {}),
			...(required ? { required: true } : {}),
			...(p.description ? { description: p.description } : {}),
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
