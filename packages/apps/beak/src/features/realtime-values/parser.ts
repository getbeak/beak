import { generateValueIdent } from '@beak/app-beak/lib/beak-variable-group/utils';
import { TypedObject } from '@beak/shared-common/helpers/typescript';
import { ValueParts } from '@beak/shared-common/types/beak-project';

import { getRealtimeValue } from '.';
import { Context } from './types';

export async function parseValueParts(
	ctx: Context,
	parts: ValueParts,
	recursiveSet: Set<string> = new Set(),
): Promise<string> {
	const out = await Promise.all(parts.map(async p => {
		if (typeof p === 'string')
			return p;

		if (typeof p !== 'object')
			return `[Unknown value part ${p}:(${typeof p})]`;

		const rtv = getRealtimeValue(p.type);

		if (!rtv)
			return '[Unknown realtime value]';

		// Realtime values can in some situations references each other or themselves, so we need to be clever and
		// detect recursive references.What we do is keep a set of each VG item id that we have seen so far, and if we
		// hit the same once twice, then we simply exit out, preventing a loop.
		const recursiveKey = rtv.getRecursiveKey?.(ctx, p.payload);

		if (recursiveKey) {
			if (recursiveSet.has(recursiveKey))
				return '';

			recursiveSet.add(recursiveKey);
		}

		const value = await rtv.getValue(ctx, p.payload, recursiveSet);

		if (Array.isArray(value))
			return await parseValueParts(ctx, value, recursiveSet);

		return value;
	}));

	return out.join('');
}

export function getValueParts(ctx: Context, itemId: string) {
	return getValueObject(ctx, itemId);
}

export function getValueObject(ctx: Context, itemId: string) {
	for (const key of TypedObject.keys(ctx.variableGroups)) {
		const variableGroup = ctx.variableGroups[key];
		const selectedGroup = ctx.selectedGroups[key];
		const value = variableGroup.values[generateValueIdent(selectedGroup, itemId)];

		if (value)
			return value;
	}

	return null;
}
