import { YAMLException, load as yamlLoad } from 'js-yaml';

/**
 * Parse a user-supplied OpenAPI spec source (the raw text of a `.json` or
 * `.yaml` file) into a plain JS object. Tries JSON first when the content
 * looks like JSON; otherwise falls back to YAML. Filename extension is
 * used as a hint but never overrides the content sniff.
 *
 * Returns either `{ ok: true, spec }` or `{ ok: false, error }`. Pure
 * function; no IO. The structural shape isn't validated — that's the
 * converter's job (`openapiToCollection`).
 */
export type ParseSpecResult = { ok: true; spec: unknown } | { ok: false; error: string };

export function parseSpecSource(source: string, filename?: string): ParseSpecResult {
	const trimmed = source.trim();
	if (!trimmed) return { ok: false, error: 'Spec file is empty.' };

	const looksJson = trimmed.startsWith('{') || trimmed.startsWith('[');
	const extYaml = filename ? /\.(ya?ml)$/i.test(filename) : false;

	if (looksJson) {
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

	// YAML branch — covers `.yaml` files and JSON-via-YAML (YAML is a JSON
	// superset, so even a typo'd JSON file may parse here as YAML).
	try {
		const parsed = yamlLoad(trimmed);
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return {
				ok: false,
				error: extYaml ? 'YAML spec did not parse to an object.' : 'Spec did not parse to a JSON or YAML object.',
			};
		}
		return { ok: true, spec: parsed };
	} catch (err) {
		const message = err instanceof YAMLException ? err.message : err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			error: extYaml ? `Failed to parse spec as YAML — ${message}` : `Failed to parse spec — ${message}`,
		};
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
