import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableGroupItem, VariableGroups } from '@beak/common/types/beak-project';

import { getValueString } from '../parser';
import { RealtimeValueImplementation } from './types';

const type = 'variable_group_item';

function getItemIdFlair(variableGroups: VariableGroups, itemId: string) {
	if (!variableGroups)
		return { variableGroup: 'Unknown' };

	const keys = TypedObject.keys(variableGroups);

	for (const key of keys) {
		const vg = variableGroups[key];
		const itemValue = vg.items[itemId];

		if (itemValue) {
			return {
				variableGroup: key,
				item: itemValue,
			};
		}
	}

	return { variableGroup: 'Unknown' };
}

export default {
	type,

	toHtml: ({ payload }, variableGroups) => {
		const itemId = payload.itemId;
		const { variableGroup, item } = getItemIdFlair(variableGroups, itemId);

		return {
			type,
			key: `${type}:${itemId}`,
			dataset: { 'item-id': itemId },
			renderer: {
				title: variableGroup,
				body: item,
			},
		};
	},

	fromHtml: dataset => {
		const itemId = dataset.payloadItemId;

		return {
			type,
			payload: { itemId },
		};
	},

	parse: (item, variableGroups, selectedGroups) =>
		getValueString(selectedGroups, variableGroups, item.payload.itemId),
} as RealtimeValueImplementation<VariableGroupItem>;
