import { generateValueIdent } from '@beak/app/lib/beak-variable-group/utils';
import { TypedObject } from '@beak/common/helpers/typescript';
import { ValueParts } from '@beak/common/types/beak-project';

import { getRealtimeValue } from './realtime-values';
import { Context } from './realtime-values/types';

export async function parseValueParts(ctx: Context, parts: ValueParts) {
	const out = await Promise.all(parts.map(async p => {
		if (typeof p === 'string')
			return p;

		if (typeof p !== 'object')
			throw new Error('Unknown part type');

		const rtv = getRealtimeValue(p.type);

		if (!rtv)
			return '[Unknown realtime value]';

		return await rtv.getValue(ctx, p.payload);
	}));

	return out.join('');
}

export function getValueString(ctx: Context, itemId: string) {
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
