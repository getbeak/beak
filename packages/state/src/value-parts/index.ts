import type { ValueSection, ValueSections } from '@getbeak/types/values';

/**
 * Pure helpers for working with `ValueSections` — the Beak primitive that
 * represents user-authored values as an alternating sequence of literal
 * strings and realtime-value references (variable-set items, response
 * extractions, env values, etc).
 *
 * Every consumer in the codebase used to hand-roll the same emptiness
 * predicate (`parts.every(p => typeof p === 'string' && p.length === 0)`)
 * — at the time of extraction this exact line appeared verbatim in 8
 * files. Concentrating it here avoids the drift where one caller forgets
 * the `length === 0` clause and silently treats a single empty literal
 * as non-empty (or vice versa).
 */

/**
 * `true` when the value-parts array would render to an empty string —
 * either no parts at all, or every part is an empty string literal. A
 * non-string part (variable reference) is *not* empty even if its
 * resolution might be — that's a flight-time concern.
 */
export function isEmpty(parts: ValueSections | undefined): boolean {
	if (!parts || parts.length === 0) return true;
	return parts.every(p => typeof p === 'string' && p.length === 0);
}

/**
 * Concatenate the value-parts into a single string for display. Non-string
 * parts are replaced by the `placeholder` callback so callers can decide
 * how to render variable references in a flat context (e.g. a list row).
 * For flight-time resolution use `parseValueSections` instead — this
 * helper deliberately does no IO.
 */
export function flatten(
	parts: ValueSections,
	placeholder: (part: Exclude<ValueSection, string>) => string = () => '?',
): string {
	return parts.map(p => (typeof p === 'string' ? p : placeholder(p as Exclude<ValueSection, string>))).join('');
}

/**
 * Walk every part in order, invoking `fn` for each. Mirrors `Array#forEach`
 * but reads more clearly at call sites that are doing domain work rather
 * than array iteration.
 */
export function walk(parts: ValueSections, fn: (part: ValueSection, index: number) => void): void {
	for (let i = 0; i < parts.length; i++) fn(parts[i]!, i);
}

/**
 * Substitute regex-matched sub-segments inside string-literal parts with
 * replacement value-parts, splicing the result. Non-string parts are
 * passed through unchanged. Matches that the `replace` callback returns
 * `null` for are kept as literal strings — useful when a token is
 * unbound and you want the user to see what's missing rather than a
 * silent omission.
 *
 * `pattern` is treated as global even if the caller forgot the `g` flag.
 */
export function substitute(
	parts: ValueSections,
	pattern: RegExp,
	replace: (match: RegExpExecArray) => ValueSections | null,
): ValueSections {
	const out: ValueSections = [];
	for (const part of parts) {
		if (typeof part !== 'string') {
			out.push(part);
			continue;
		}
		out.push(...substituteInString(part, pattern, replace));
	}
	return out;
}

function substituteInString(
	s: string,
	pattern: RegExp,
	replace: (match: RegExpExecArray) => ValueSections | null,
): ValueSections {
	const regex = pattern.global
		? new RegExp(pattern.source, pattern.flags)
		: new RegExp(pattern.source, `${pattern.flags}g`);
	regex.lastIndex = 0;
	const result: ValueSections = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null = regex.exec(s);
	while (match !== null) {
		const before = s.slice(lastIndex, match.index);
		if (before) result.push(before);
		const replacement = replace(match);
		if (replacement && replacement.length > 0) result.push(...replacement);
		else result.push(match[0]);
		lastIndex = match.index + match[0].length;
		match = regex.exec(s);
	}
	const rest = s.slice(lastIndex);
	if (rest) result.push(rest);
	return result;
}
