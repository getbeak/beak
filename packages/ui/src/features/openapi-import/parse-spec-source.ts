/**
 * Parse a user-supplied OpenAPI spec source (the raw text of a `.json` or
 * `.yaml` file) into a plain JS object. JSON is parsed natively; YAML is
 * NOT handled here yet — we surface a friendly error so the UI can guide
 * the user to convert to JSON until we wire `js-yaml` in.
 *
 * Returns either `{ ok: true, spec }` or `{ ok: false, error }`. Pure
 * function; no IO. The structural shape isn't validated — that's the
 * converter's job (`openapiToCollection`).
 */
export type ParseSpecResult =
	| { ok: true; spec: unknown }
	| { ok: false; error: string };

export function parseSpecSource(source: string, filename?: string): ParseSpecResult {
	const trimmed = source.trim();
	if (!trimmed) return { ok: false, error: 'Spec file is empty.' };

	const looksJson = trimmed.startsWith('{') || trimmed.startsWith('[');
	const extYaml = filename ? /\.(ya?ml)$/i.test(filename) : false;

	if (extYaml && !looksJson) {
		return {
			ok: false,
			error: 'YAML spec imports are not supported yet — convert the spec to JSON and try again.',
		};
	}

	try {
		const parsed = JSON.parse(trimmed);
		if (parsed === null || typeof parsed !== 'object') {
			return { ok: false, error: 'Spec must parse to a JSON object.' };
		}
		return { ok: true, spec: parsed };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: `Failed to parse spec as JSON — ${message}` };
	}
}

/**
 * Quick sniff for "is this an OpenAPI 3.x document?". Used so the UI can warn
 * before kicking off the sync rather than letting the converter emit a
 * lower-level warning.
 */
export function looksLikeOpenApi3(spec: unknown): boolean {
	if (!spec || typeof spec !== 'object') return false;
	const v = (spec as { openapi?: unknown }).openapi;
	return typeof v === 'string' && v.startsWith('3.');
}
