import { generateValueIdent } from '@beak/app/lib/beak-variable-group/utils';
import { ipcExtensionsService } from '@beak/app/lib/ipc';
import { TypedObject } from '@beak/common/helpers/typescript';
import type { Context, ValueParts } from '@getbeak/types/values';
import { RealtimeValueManager } from '.';

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

		const rtv = RealtimeValueManager.getRealtimeValue(p.type);

		if (!rtv)
			return '[Unknown realtime value]';

		// Realtime values can in some situations references each other or themselves, so we need to be clever and
		// detect recursive references. What we do is keep a set of each VG item id that we have seen so far, and if we
		// hit the same once twice, then we simply exit out, preventing a loop.
		const recursiveKey = `${p.type}:${JSON.stringify(p.payload)}`;

		if (recursiveKey) {
			if (recursiveSet.has(recursiveKey))
				return '';

			recursiveSet.add(recursiveKey);
		}

		if (rtv.external) {
			return await ipcExtensionsService.rtvGetValue({
				type: rtv.type,
				context: ctx,
				payload: p.payload as any,
				recursiveSet: Array.from(recursiveSet),
			});
		}

		return await rtv.getValue(ctx, p.payload, recursiveSet);
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
