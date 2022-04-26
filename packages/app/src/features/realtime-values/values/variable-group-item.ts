import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableGroups } from '@beak/common/types/beak-project';
import { VariableGroupItemRtv } from '@beak/common/types/realtime-values';

import { getValueParts } from '../parser';
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

	getRecursiveKey: (_ctx, item) => `${type}:${item.itemId}`,
	getValue: async (ctx, item) => getValueParts(ctx, item.itemId) || [],

	attributes: {},
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

		getRecursiveKey: () => {
			throw new Error('Not supported, this should not happen.');
		},
		getValue: () => {
			throw new Error('Not supported, this should not happen.');
		},

		attributes: {},
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
