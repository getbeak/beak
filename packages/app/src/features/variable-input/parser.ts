import { TypedObject } from '@beak/common/helpers/typescript';
import { ValueParts } from '@beak/common/types/beak-project';

import { getRealtimeValue } from './realtime-values';
import { Context } from './realtime-values/types';

export async function parseValueParts(ctx: Context, parts: ValueParts) {
	const out = await Promise.all(parts.map(p => {
		if (typeof p === 'string')
			return p;

		if (typeof p !== 'object')
			throw new Error('Unknown part type');

		const rtv = getRealtimeValue(p.type);

		return rtv.getValue(ctx, p.payload);
	}));

	return out.join('');
}

export function getValueString(ctx: Context, itemId: string) {
	return getValueObject(ctx, itemId)?.value;
}

export function getValueObject(ctx: Context, itemId: string) {
	for (const key of TypedObject.keys(ctx.variableGroups)) {
		const variableGroup = ctx.variableGroups[key];
		const selectedGroup = ctx.selectedGroups[key];
		const value = TypedObject.values(variableGroup.values)
			.find(v => v.groupId === selectedGroup && v.itemId === itemId);

		if (value)
			return value;
	}

	return null;
}
