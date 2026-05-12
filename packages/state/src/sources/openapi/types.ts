/**
 * Subset of the OpenAPI 3.x document shape that we currently consume. The
 * official OpenAPI schema is huge — we model only the fields that drive
 * our converter so callers get type-checked access and we don't bring in
 * a heavy validation dependency. Extra fields are ignored (passthrough).
 */
export interface OpenApiDocument {
	openapi: string;
	info: { title: string; version: string; description?: string };
	servers?: OpenApiServer[];
	paths?: Record<string, OpenApiPathItem>;
	components?: { parameters?: Record<string, OpenApiParameter> };
}

export interface OpenApiServer {
	url: string;
	description?: string;
}

export interface OpenApiPathItem {
	parameters?: Array<OpenApiParameter | OpenApiReference>;
	get?: OpenApiOperation;
	put?: OpenApiOperation;
	post?: OpenApiOperation;
	delete?: OpenApiOperation;
	patch?: OpenApiOperation;
	head?: OpenApiOperation;
	options?: OpenApiOperation;
	trace?: OpenApiOperation;
}

export interface OpenApiOperation {
	operationId?: string;
	summary?: string;
	description?: string;
	tags?: string[];
	parameters?: Array<OpenApiParameter | OpenApiReference>;
	requestBody?: OpenApiRequestBody | OpenApiReference;
}

export interface OpenApiParameter {
	name: string;
	in: 'query' | 'header' | 'path' | 'cookie';
	required?: boolean;
	description?: string;
	schema?: OpenApiSchema;
}

export interface OpenApiReference {
	$ref: string;
}

export interface OpenApiRequestBody {
	content?: Record<string, { schema?: OpenApiSchema }>;
	required?: boolean;
}

export interface OpenApiSchema {
	type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
	example?: unknown;
	default?: unknown;
	enum?: unknown[];
}

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];
