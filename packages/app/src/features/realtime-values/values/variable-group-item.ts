import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableGroups } from '@beak/common/types/beak-project';
import { VariableGroupItemRtv } from '@beak/common/types/realtime-values';

import { getValueParts, parseValueParts } from '../parser';
import { RealtimeValue } from '../types';

const type = 'variable_group_item';

export default {
	type,

	name: 'Variable group item',
	description: 'A realtime value, you can edit it\'s value from the Variable Group editor',
	sensitive: false,

	initValuePart: () => {
		throw new Error('Not supported, this should not happen.');
	},

	getValue: async (ctx, item) => {
		const valueParts = getValueParts(ctx, item.itemId) || [];
		const filtered = valueParts.filter(p => {
			if (typeof p === 'string')
				return true;

			if (p.type !== 'variable_group_item')
				return true;

			// Remove if it's a loop!
			return p.payload.itemId !== item.itemId;
		});

		return await parseValueParts(ctx, filtered);
	},
} as RealtimeValue<VariableGroupItemRtv>;

export function createFauxValue(item: VariableGroupItemRtv['payload'], variableGroups: VariableGroups) {
	return {
		type,

		name: getVariableGroupItemName(item, variableGroups),
		description: 'A realtime value, you can edit it\'s value from the Variable Group editor',
		sensitive: false,

		initValuePart: async () => ({
			type,
			payload: item,
		}),

		getValue: () => {
			throw new Error('Not supported, this should not happen.');
		},
	} as RealtimeValue<VariableGroupItemRtv>;
}

export function getVariableGroupItemName(item: VariableGroupItemRtv['payload'], variableGroups: VariableGroups) {
	if (!variableGroups)
		return 'Unknown';

	const keys = TypedObject.keys(variableGroups);

	for (const key of keys) {
		const vg = variableGroups[key];
		const itemValue = vg.items[item.itemId];

		if (itemValue)
			return `${key} (${itemValue})`;
	}

	return 'Unknown';
}
