import type { CollectionDefaults, RequestFile, RequestFileOverride } from './beak-project';

/**
 * Merge a collection's defaults with a sparse request override to produce a
 * concrete `RequestFile`-shaped value. Override fields win; defaults fill in
 * the gaps. Object-valued fields (query, headers) are shallow-merged by key
 * so a default header set can be partially overridden without restating the
 * whole map.
 *
 * `baseUrl` from the defaults is concatenated to the override's `url` when
 * the override does not declare its own `url` — i.e. requests inherit the
 * collection's base URL.
 *
 * Pure function — does not mutate either argument.
 */
export function mergeCollectionDefaults(
	defaults: CollectionDefaults | undefined,
	override: RequestFileOverride,
): RequestFile {
	const d = defaults ?? {};

	return {
		id: override.id,
		// Lowercase matches how new requests are created (lib/beak-project/request.ts)
		// and how the rest of the storage shape is stored. Display layers
		// call .toUpperCase() when rendering.
		verb: override.verb ?? d.verb ?? 'get',
		url: override.url ?? d.baseUrl ?? [''],
		query: shallowMergeRecord(d.query, override.query),
		headers: shallowMergeRecord(d.headers, override.headers),
		// Path parameters are per-operation by construction (each declares its
		// own `{name}` placeholders in the URL), so there's no collection-level
		// default to merge against — just pass the override through.
		...(override.pathParameters ? { pathParameters: override.pathParameters } : {}),
		body: override.body ?? d.body,
		options: mergeOptions(d.options, override.options),
		...(override.operationId !== undefined ? { operationId: override.operationId } : {}),
		// Provenance + introspection ride along — they identify a request
		// against its source spec and must survive the merge so re-syncs and
		// exporters can map a runtime request back to its origin.
		...(override._provenance ? { _provenance: override._provenance } : {}),
		...(override.introspection ? { introspection: override.introspection } : {}),
	};
}

/**
 * Inverse of {@link mergeCollectionDefaults}: given concrete defaults and a
 * concrete request, return the sparse override that, when merged back with
 * the defaults, reproduces the request. Fields equal to the default are
 * omitted; fields that differ are written out in full.
 */
export function diffFromDefaults(defaults: CollectionDefaults | undefined, request: RequestFile): RequestFileOverride {
	const d = defaults ?? {};
	const override: RequestFileOverride = { id: request.id };

	if (request.verb !== d.verb) override.verb = request.verb;
	if (!sameValueParts(request.url, d.baseUrl)) override.url = request.url;

	const queryDiff = diffRecord(d.query, request.query);
	if (queryDiff) override.query = queryDiff;

	const headersDiff = diffRecord(d.headers, request.headers);
	if (headersDiff) override.headers = headersDiff;

	// Path parameters live on the request only — no collection default to diff
	// against. Pass through verbatim when non-empty so re-syncs round-trip
	// the metadata cleanly.
	if (request.pathParameters && Object.keys(request.pathParameters).length > 0)
		override.pathParameters = request.pathParameters;

	if (request.body !== undefined && !deepEqual(request.body, d.body)) override.body = request.body;

	const optionsDiff = diffOptions(d.options, request.options);
	if (optionsDiff) override.options = optionsDiff;

	const operationId = (request as RequestFile & { operationId?: string }).operationId;
	if (operationId !== undefined) override.operationId = operationId;

	return override;
}

function shallowMergeRecord<T>(a: Record<string, T> | undefined, b: Record<string, T> | undefined): Record<string, T> {
	if (!a && !b) return {};
	if (!a) return { ...b } as Record<string, T>;
	if (!b) return { ...a };
	return { ...a, ...b };
}

function diffRecord<T>(
	defaults: Record<string, T> | undefined,
	concrete: Record<string, T> | undefined,
): Record<string, T> | undefined {
	if (!concrete || Object.keys(concrete).length === 0) return undefined;
	if (!defaults) return concrete;

	const diff: Record<string, T> = {};
	let changed = false;
	for (const [key, value] of Object.entries(concrete)) {
		if (!deepEqual(defaults[key], value)) {
			diff[key] = value;
			changed = true;
		}
	}
	return changed ? diff : undefined;
}

function mergeOptions(a: CollectionDefaults['options'], b: RequestFileOverride['options']): RequestFile['options'] {
	if (!a && !b) return undefined;
	return { ...(a ?? {}), ...(b ?? {}) };
}

function diffOptions(a: CollectionDefaults['options'], b: RequestFile['options']): RequestFileOverride['options'] {
	if (!b || Object.keys(b).length === 0) return undefined;
	if (!a) return b;
	const diff: NonNullable<RequestFileOverride['options']> = {};
	let changed = false;
	for (const [key, value] of Object.entries(b)) {
		if ((a as Record<string, unknown>)[key] !== value) {
			(diff as Record<string, unknown>)[key] = value;
			changed = true;
		}
	}
	return changed ? diff : undefined;
}

function sameValueParts(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === undefined || b === undefined) return false;
	return deepEqual(a, b);
}

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === null || b === null) return false;
	if (typeof a !== typeof b) return false;
	if (typeof a !== 'object') return false;

	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b)) return false;
		if (a.length !== b.length) return false;
		return a.every((v, i) => deepEqual(v, b[i]));
	}

	const ak = Object.keys(a as Record<string, unknown>);
	const bk = Object.keys(b as Record<string, unknown>);
	if (ak.length !== bk.length) return false;
	return ak.every(k => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}
