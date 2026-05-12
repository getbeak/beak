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
}

function buildRequestOverride({
	id,
	operationId,
	method,
	pathPattern,
	pathItem,
	operation,
	warnings,
}: BuildOverrideArgs): RequestFileOverride {
	const allParams = collectParameters(pathItem, operation, warnings);
	const queryParams = allParams.filter(p => p.in === 'query');
	const headerParams = allParams.filter(p => p.in === 'header');
	const pathParams = allParams.filter(p => p.in === 'path');

	const url = renderPath(pathPattern, pathParams);

	const override: RequestFileOverride = {
		id,
		operationId,
		verb: method.toUpperCase(),
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
): OpenApiParameter[] {
	const out: OpenApiParameter[] = [];
	const sources: (OpenApiParameter | OpenApiReference)[] = [
		...(pathItem.parameters ?? []),
		...(operation.parameters ?? []),
	];
	for (const p of sources) {
		if ('$ref' in p) {
			warnings.push(`Skipping $ref parameter '${p.$ref}' — references are not resolved yet.`);
			continue;
		}
		out.push(p);
	}
	return out;
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

function paramsToRecord(params: OpenApiParameter[]): NonNullable<RequestFileOverride['query']> {
	const out: Record<string, { name: string; value: [string]; enabled: boolean }> = {};
	for (const p of params) {
		const exampleValue = stringifyExample(p.schema);
		out[p.name] = {
			name: p.name,
			value: [exampleValue],
			enabled: p.required ?? false,
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
