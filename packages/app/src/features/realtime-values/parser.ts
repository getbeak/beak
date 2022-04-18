import { generateValueIdent } from '@beak/app/lib/beak-variable-group/utils';
import { TypedObject } from '@beak/common/helpers/typescript';
import { ValueParts } from '@beak/common/types/beak-project';

import { getRealtimeValue } from '.';
import { Context } from './types';

export async function parseValueParts(ctx: Context, parts: ValueParts): Promise<string> {
	const out = await Promise.all(parts.map(async p => {
		if (typeof p === 'string')
			return p;

		if (Array.isArray(p))
			return await parseValueParts(ctx, p);

		if (typeof p !== 'object')
			return `[Unknown value part ${p}:(${typeof p})]`;

		const rtv = getRealtimeValue(p.type);

		if (!rtv)
			return '[Unknown realtime value]';

		return await rtv.getValue(ctx, p.payload);
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
