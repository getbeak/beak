import type { ValueSections } from '@beak/ui/features/variables/values';

export interface CookieHeaderPair {
	name: string;
	value: string;
}

/**
 * Read a `Cookie` request header value as a list of `name=value` pairs.
 * Whitespace around `=` and around separators is tolerated. Pairs with
 * no `=` are treated as `name` only (value defaults to empty string)
 * so the structured editor can recover them on a round trip.
 */
export function parseCookieHeader(raw: string): CookieHeaderPair[] {
	if (!raw) return [];
	const out: CookieHeaderPair[] = [];
	for (const segment of raw.split(';')) {
		const trimmed = segment.trim();
		if (!trimmed) continue;
		const eq = trimmed.indexOf('=');
		if (eq < 0) {
			out.push({ name: trimmed, value: '' });
			continue;
		}
		const name = trimmed.slice(0, eq).trim();
		const value = trimmed.slice(eq + 1).trim();
		if (!name) continue;
		out.push({ name, value });
	}
	return out;
}

/** Serialise a list of pairs back into a `Cookie` header value. */
export function serialiseCookieHeader(pairs: CookieHeaderPair[]): string {
	return pairs
		.filter(p => p.name.length > 0)
		.map(p => `${p.name}=${p.value}`)
		.join('; ');
}

/**
 * Test whether a header's ValueSections is safely round-trippable through
 * the structured editor: the rich editor only renders when the value is
 * empty or a single string part. Variable references would lose meaning
 * during string-level pair extraction, so they fall back to the raw
 * VariableInput.
 */
export function isPlainStringValue(value: ValueSections): boolean {
	if (!value || value.length === 0) return true;
	return value.length === 1 && typeof value[0] === 'string';
}

export function valueSectionsToPlainString(value: ValueSections): string {
	if (!value || value.length === 0) return '';
	if (value.length === 1 && typeof value[0] === 'string') return value[0];
	return '';
}
