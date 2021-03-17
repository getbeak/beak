import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableGroupItemRtv, VariableGroups } from '@beak/common/types/beak-project';

import { getValueString, parseValueParts } from '../../parser';
import { RealtimeValue } from '../types';

const type = 'variable_group_item';

export default {
	type,

	name: 'Variable group item',
	description: 'A realtime value, you can edit it\'s value from the Variable Group editor',

	initValuePart: () => {
		throw new Error('Not supported, this should not happen.');
	},

	createValuePart: (_ctx, item) => ({
		type,
		payload: item,
	}),

	getValue: async (ctx, item) => await parseValueParts(
		ctx,
		getValueString(ctx, item.itemId) || [],
	),
} as RealtimeValue<VariableGroupItemRtv['payload']>;

export function createFauxValue(item: VariableGroupItemRtv['payload'], variableGroups: VariableGroups) {
	return {
		type,

		name: getVariableGroupItemName(item, variableGroups),
		description: 'A realtime value, you can edit it\'s value from the Variable Group editor',

		initValuePart: async () => ({
			type,
			payload: item,
		}),

		createValuePart: () => {
			throw new Error('Not supported, this should not happen.');
		},

		getValue: () => {
			throw new Error('Not supported, this should not happen.');
		},
	} as RealtimeValue<VariableGroupItemRtv['payload']>;
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
