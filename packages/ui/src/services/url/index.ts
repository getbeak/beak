import { TypedObject } from '@beak/common/helpers/typescript';
import { valueParts } from '@beak/state';
import type { PathParameter, RequestOverview } from '@getbeak/types/request';
import type { Context, ValueSections } from '@getbeak/types/values';
import URL from 'url-parse';

import { parseValueSections } from '../../features/variables/parser';

const PATH_PARAM_PATTERN = /:([a-zA-Z_][a-zA-Z0-9_-]*)/g;

interface ConvertOptions {
	includeQuery: boolean;
}

/**
 * Substitute `:name` path-parameter placeholders inside URL value-parts with
 * each bound entry's value, splicing the value-parts together so any
 * variables inside the bound value resolve normally downstream. Unbound
 * `:name` substrings (no entry, or entry value empty) are left as literals
 * so the user sees what's missing rather than `undefined` slipping into
 * the URL at flight time.
 */
export function substitutePathParameters(
	parts: ValueSections,
	pathParameters: Record<string, PathParameter> | undefined,
): ValueSections {
	if (!pathParameters || Object.keys(pathParameters).length === 0) return parts;
	return valueParts.substitute(parts, PATH_PARAM_PATTERN, match => {
		const bound = pathParameters[match[1]!];
		if (bound && bound.value && bound.value.length > 0) return bound.value;
		return null;
	});
}

/**
 * Resolve a request's URL for flight prep. Substitutes path parameters,
 * resolves variables, normalises `file://` to `https://httpbin.org` (a
 * historical quirk — the editor seeds a `file:` placeholder when nothing's
 * been typed yet), and appends the request's query rows.
 *
 * Returns a `url-parse` instance so callers can read individual URL fields
 * without re-parsing. `.toString()` produces the final wire URL.
 */
export async function convertRequestToUrl(context: Context, info: RequestOverview, opts?: Partial<ConvertOptions>) {
	const urlParts = substitutePathParameters(info.url, info.pathParameters);
	const value = await parseValueSections(context, urlParts);
	const url = new URL(value, true);
	const options = { includeQuery: true, ...opts };

	if (url.protocol === 'file:') {
		url.set('protocol', 'https:');
		url.set('host', 'httpbin.org');
	}

	url.set('query', undefined);

	if (options.includeQuery && info.query) {
		const entries = TypedObject.values(info.query).filter(q => q.enabled);
		const resolved = await Promise.all(
			entries.map(async q => [q.name, await parseValueSections(context, q.value)] as const),
		);

		// URLSearchParams.append (not set) so two params with the same name
		// both appear in the resulting `?foo=1&foo=2` — the previous
		// object-keyed accumulator silently dropped duplicates.
		const params = new URLSearchParams();
		for (const [name, val] of resolved) params.append(name, val);

		url.set('query', params.toString());
	}

	return url;
}

export interface UrlEditChange {
	/**
	 * URL parts with any `?query=string` tail trimmed off — what should go
	 * back into the request's `url` field. Identical to the input parts
	 * when no `?` was typed.
	 */
	sanitisedParts: ValueSections;
	/**
	 * Query params extracted from a `?…` tail the user typed into the URL
	 * bar. Each one should be added as a row in the request's `query` map.
	 * Empty array when no query string was present.
	 */
	extractedQuery: Array<{ name: string; value: string }>;
	/**
	 * `true` when a `?` was detected — UI should auto-flip the modifier tab
	 * to "Params" so the user sees where their typed query went.
	 */
	queryDetected: boolean;
}

/**
 * Analyse a user-edited URL: resolve variables, detect `?key=val` tails,
 * pull them out into structured query rows, and return parts cleaned of
 * the query string. The caller dispatches whatever it needs to from the
 * structured result — keeping this pure means the same logic can run in
 * a unit test without redux + a real URL field.
 *
 * No-op when the URL has no query tail: `sanitisedParts === parts`,
 * `extractedQuery === []`, `queryDetected === false`.
 */
export async function analyseUrlEdit(parts: ValueSections, context: Context): Promise<UrlEditChange> {
	const value = await parseValueSections(context, parts);
	const parsed = new URL(value, true);
	const queryKeys = Object.keys(parsed.query);

	if (!value.includes('?')) {
		return { sanitisedParts: parts, extractedQuery: [], queryDetected: false };
	}

	const extractedQuery = queryKeys.map(name => ({ name, value: parsed.query[name] ?? '' }));

	const searchIndex = parts.findIndex(p => typeof p === 'string' && p.includes('?'));
	const sanitisedParts: ValueSections = parts.slice(0, searchIndex);
	if (searchIndex >= 0) {
		const segment = parts[searchIndex] as string;
		const searchPartIndex = segment.indexOf('?');
		sanitisedParts.push(segment.slice(0, searchPartIndex));
	}

	return { sanitisedParts, extractedQuery, queryDetected: true };
}
