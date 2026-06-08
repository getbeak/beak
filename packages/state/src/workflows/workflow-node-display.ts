import type { RequestOverrides } from './types';

/**
 * Flatten value-sections into a string for canvas previews. RTV chips
 * collapse to `{var}` so the pill never explodes on a templated URL.
 */
export function previewValueSections(parts: unknown[] | undefined): string {
	if (!parts) return '';
	return parts.map(p => (typeof p === 'string' ? p : '{var}')).join('');
}

/**
 * Read the plain-string portion of a value-sections array — used by the
 * panel's <Input>/<Textarea> editors that only author plain text for now.
 * RTV-typed parts collapse to "" so a round-trip through this reader is
 * lossless for plain-text payloads.
 */
export function readPlainText(value: unknown): string {
	if (!Array.isArray(value)) return '';
	return value.filter((v): v is string => typeof v === 'string').join('');
}

/**
 * Count override slots that the user actually touched. A slot with neither
 * `value` nor `enabled` set is a pass-through and shouldn't count toward
 * the badge.
 */
export function countOverrideEntries(record?: Record<string, { value?: unknown; enabled?: boolean }>): number {
	if (!record) return 0;
	let n = 0;
	for (const r of Object.values(record)) {
		if (r.value !== undefined || r.enabled !== undefined) n++;
	}
	return n;
}

/**
 * Compact badge label shown on a request node's canvas pill — summarises
 * the override slots touched. Returns `null` when nothing's overridden so
 * the badge can be hidden entirely.
 */
export function overrideBadgeText(overrides?: RequestOverrides): string | null {
	if (!overrides) return null;
	const parts: string[] = [];
	const headers = countOverrideEntries(overrides.headers);
	const query = countOverrideEntries(overrides.query);
	const bodyFields = countOverrideEntries(overrides.body?.fields);
	const bodyRaw = Boolean(
		overrides.body?.raw && (overrides.body.raw.contentType || (overrides.body.raw.text?.length ?? 0) > 0),
	);
	if (headers > 0) parts.push(`${headers}h`);
	if (query > 0) parts.push(`${query}q`);
	if (bodyFields > 0 || bodyRaw) parts.push('body');
	if (overrides.fragment && overrides.fragment.length > 0) parts.push('frag');
	return parts.length === 0 ? null : parts.join(' · ');
}
