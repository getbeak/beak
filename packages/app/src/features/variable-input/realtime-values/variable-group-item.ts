import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableGroupItemRtv, VariableGroups } from '@beak/common/types/beak-project';

import { getValueString } from '../parser';
import { RealtimeValue } from './types';

const type = 'variable_group_item';

export default {
	type,

	name: 'Variable group item',
	description: 'Blah blah blah, something should go here.',

	initValuePart: () => {
		throw new Error('Not supported, this should not happen.');
	},

	createValuePart: item => ({
		type,
		payload: item,
	}),

	getValue: (item, variableGroups, selectedGroups) => getValueString(selectedGroups, variableGroups, item.itemId),
} as RealtimeValue<VariableGroupItemRtv['payload']>;

export function createFauxGviRtv(item: VariableGroupItemRtv['payload'], variableGroups: VariableGroups) {
	return {
		type,

		name: getVariableGroupItemName(item, variableGroups),
		description: 'Blah blah blah, something should go here.',

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
