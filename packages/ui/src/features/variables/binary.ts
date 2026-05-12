import type { AssetRef } from '@getbeak/extension-sdk';
import type { Context, ValueSections } from '@getbeak/types/values';

import { VariableManager } from '.';

const RECURSION_LIMIT = 5;

/**
 * Resolve a single value part for a binary sink (e.g. a `file` request body).
 *
 * - Literal strings pass through unchanged.
 * - A typed value-part whose variable defines {@link AssetRef}-producing
 *   {@link Variable.getAssetRef} returns the ref so the consumer can wire it
 *   to disk without ever stringifying.
 * - A variable without `getAssetRef` falls back to `getValue` (the existing
 *   string path) so legacy variables keep working in mixed sinks.
 * - Recursion is capped to mirror {@link parseValueSections}.
 *
 * Returns `null` on errors or when the variable resolves nothing — callers
 * decide whether that's an empty body, a default, or an alert.
 */
export async function resolveValuePartForBinary(
	ctx: Context,
	part: ValueSections[number],
	depth = 0,
): Promise<AssetRef | string | null> {
	if (typeof part === 'string') return part;
	if (typeof part !== 'object' || part === null) return null;
	if (depth >= RECURSION_LIMIT) return null;

	const rtv = VariableManager.getVariable(part.type);
	if (!rtv) return null;

	try {
		if (typeof rtv.getAssetRef === 'function') {
			const ref = await rtv.getAssetRef(ctx, part.payload, depth + 1);
			if (ref) return ref;
			// `null` from `getAssetRef` means "no binary content this time" — fall
			// through to the string path.
		}
		return await rtv.getValue(ctx, part.payload, depth + 1);
	} catch {
		return null;
	}
}

/**
 * Resolve a list of value parts for a binary sink. Returns the *first* asset
 * ref encountered (binary sinks are single-value: a file body is one blob)
 * along with any concatenated strings that came before it. If no asset ref
 * is produced, returns the concatenated string result — matching the existing
 * `parseValueSections` behaviour.
 */
export async function parseValueSectionsForBinary(
	ctx: Context,
	parts: ValueSections,
	depth = 0,
): Promise<{ ref: AssetRef; precedingText: string } | { ref: null; text: string }> {
	let buffer = '';
	for (const part of parts) {
		const resolved = await resolveValuePartForBinary(ctx, part, depth);
		if (resolved === null) continue;
		if (typeof resolved === 'string') {
			buffer += resolved;
			continue;
		}
		// First AssetRef wins. Subsequent parts are ignored for binary sinks —
		// the file body has room for one blob.
		return { ref: resolved, precedingText: buffer };
	}
	return { ref: null, text: buffer };
}
