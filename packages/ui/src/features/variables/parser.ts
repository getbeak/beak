import { TypedObject } from '@beak/common/helpers/typescript';
import { generateValueIdent } from '@beak/ui/services/variable-sets/utils';
import type { Context, ValueSections } from '@getbeak/types/values';

import { resolveValueSections } from './resolver';

/**
 * Backwards-compatible text-sink entry point. Delegates to the resolver
 * with `Sink: 'text'` so every legacy call site keeps the "concatenated
 * string, recursion-capped, timeout-guarded" shape it has always had.
 * Removed once all callers spell `resolveValueSections` directly.
 */
export async function parseValueSections(
	ctx: Context,
	parts: ValueSections,
	depth = 0,
	sensitiveMode = false,
): Promise<string> {
	const resolved = await resolveValueSections(ctx, parts, { kind: 'text' }, depth, { sensitiveMode });
	return resolved.kind === 'text' ? resolved.text : '';
}

export function getValueSections(ctx: Context, itemId: string) {
	return getValueObject(ctx, itemId);
}

export function getValueObject(ctx: Context, itemId: string) {
	for (const key of TypedObject.keys(ctx.variableSets)) {
		const variableSet = ctx.variableSets[key];
		const selectedSet = ctx.selectedSets[key];
		const value = variableSet.values[generateValueIdent(selectedSet, itemId)];

		if (value) return value;
	}

	return null;
}
