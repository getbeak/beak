import { generateValueIdent } from '@beak/app/lib/beak-variable-group/utils';
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
			return '';

		const rtv = RealtimeValueManager.getRealtimeValue(p.type);

		if (!rtv)
			return '';

		// NOTE(afr): Bring this back before 1.1.7 goes public
		// // Realtime values can in some situations references each other or themselves, so we need to be clever and
		// // detect recursive references.
		// const recursiveKey = `${p.type}:${JSON.stringify(p.payload)}`;

		// if (recursiveKey) {
		// 	if (recursiveSet.has(recursiveKey))
		// 		return '';

		// 	recursiveSet.add(recursiveKey);
		// }

		try {
			return Promise.race([
				rtv.getValue(ctx, p.payload, recursiveSet),
				new Promise(resolve => {
					window.setTimeout(() => {
						// eslint-disable-next-line no-console
						console.error(`Fetching value for ${rtv.type} exceeded 600ms`);
						resolve('');
					}, 600);
				}),
			]);
		} catch (error) {
			// TODO(afr): Move this to some sort of alert
			// eslint-disable-next-line no-console
			console.error(`Failed to get value from ${rtv.type}`);

			return '';
		}
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
