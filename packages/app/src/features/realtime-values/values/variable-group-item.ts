import { VariableGroupItemRtv } from '@beak/app/features/realtime-values/values';
import { TypedObject } from '@beak/common/helpers/typescript';
import { RealtimeValue } from '@getbeak/types-realtime-value';
import type { VariableGroups } from '@getbeak/types/variable-groups';

import { getValueParts, parseValueParts } from '../parser';

const type = 'variable_group_item';

const definition: RealtimeValue<VariableGroupItemRtv> = {
	type,
	name: 'Variable group item',
	description: 'A realtime value, you can edit it\'s value from the Variable Group editor',
	sensitive: false,
	external: false,

	createDefaultPayload: () => {
		throw new Error('Not supported, this should not happen.');
	},

	getValue: async (ctx, item, recursiveSet) => {
		const parts = getValueParts(ctx, item.itemId) || [];

		return await parseValueParts(ctx, parts, recursiveSet);
	},

	attributes: {},
};

export function createFauxValue(
	item: VariableGroupItemRtv,
	variableGroups: VariableGroups,
): RealtimeValue<VariableGroupItemRtv> {
	return {
		type,
		name: getVariableGroupItemName(item, variableGroups),
		description: 'A realtime value, you can edit it\'s value from the Variable Group editor',
		sensitive: false,
		external: false,

		createDefaultPayload: async () => item,

		getValue: () => {
			throw new Error('Not supported, this should not happen.');
		},

		attributes: {},
	};
}

export function getVariableGroupItemName(item: VariableGroupItemRtv, variableGroups: VariableGroups) {
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

export default definition;
