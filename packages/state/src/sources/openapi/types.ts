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
	components?: {
		parameters?: Record<string, OpenApiParameter>;
		/**
		 * Named schemas — the dereferencer follows `$ref: '#/components/schemas/Foo'`
		 * into this map. Without it, refs would fall through to text bodies.
		 */
		schemas?: Record<string, OpenApiSchema>;
		responses?: Record<string, OpenApiResponse>;
		requestBodies?: Record<string, OpenApiRequestBody>;
	};
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
	/**
	 * Response definitions keyed by status code (or `default`). We mine
	 * `200` / `204` for their content schemas as a body-schema fallback when
	 * the operation has no `requestBody` — most useful for GET endpoints
	 * where the response shape is the canonical description of the
	 * resource. Most specs put the actual schema info here.
	 */
	responses?: Record<string, OpenApiResponse | OpenApiReference>;
}

export interface OpenApiResponse {
	description?: string;
	content?: Record<string, { schema?: OpenApiSchema }>;
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

/**
 * OpenAPI schema fragment — a (mostly) JSON Schema subset we walk to seed
 * Beak's structured body editor. Refs are resolved against the document's
 * `components.schemas` map by the converter; nested `properties` / `items`
 * recurse into more `OpenApiSchema` nodes.
 */
export interface OpenApiSchema {
	type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
	example?: unknown;
	default?: unknown;
	enum?: unknown[];
	description?: string;
	format?: string;
	nullable?: boolean;
	required?: string[];
	properties?: Record<string, OpenApiSchema | OpenApiReference>;
	items?: OpenApiSchema | OpenApiReference;
	additionalProperties?: boolean | OpenApiSchema | OpenApiReference;
	$ref?: string;
	// String-shaped constraints (JSON Schema). The converter pulls these
	// through onto parameter entries so the request-pane editor can show
	// inline hints + validate before flight, and so we can round-trip back
	// to OpenAPI on export.
	pattern?: string;
	minLength?: number;
	maxLength?: number;
	// Numeric constraints. `exclusiveMinimum` / `exclusiveMaximum` exist in
	// JSON Schema but are rarely seen in real OpenAPI specs — left out for
	// now; add only if a real spec demands them.
	minimum?: number;
	maximum?: number;
	multipleOf?: number;
	/**
	 * Composition keywords — we don't fully resolve these (it would require
	 * full schema synthesis) but the converter picks the first branch as a
	 * pragmatic "show me something" seed.
	 */
	allOf?: Array<OpenApiSchema | OpenApiReference>;
	anyOf?: Array<OpenApiSchema | OpenApiReference>;
	oneOf?: Array<OpenApiSchema | OpenApiReference>;
}

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];
