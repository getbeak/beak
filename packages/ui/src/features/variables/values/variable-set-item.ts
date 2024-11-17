import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableSetItemRtv } from '@beak/ui/features/variables/values';
import type { VariableSets } from '@getbeak/types/variable-sets';
import { Variable } from '@getbeak/types-variables';

import { getValueSections, parseValueSections } from '../parser';

const type = 'variable_set_item';

const definition: Variable<VariableSetItemRtv> = {
	type,
	name: 'Variable set item',
	description: 'A variable from a variable set, you can edit it\'s value from the Variable Group editor',
	sensitive: false,
	external: false,

	createDefaultPayload: () => {
		throw new Error('Not supported, this should not happen.');
	},

	getValue: async (ctx, item, recursiveDepth) => {
		const parts = getValueSections(ctx, item.itemId) || [];

		return await parseValueSections(ctx, parts, recursiveDepth);
	},

	attributes: {},
};

export function createFauxValue(
	item: VariableSetItemRtv,
	variableSets: VariableSets,
): Variable<VariableSetItemRtv> {
	return {
		type,
		name: getVariableSetItemName(item, variableSets),
		description: 'A variable from a variable set, you can edit it\'s value from the Variable Group editor',
		sensitive: false,
		external: false,

		getContextAwareName: void 0,
		createDefaultPayload: async () => item,

		getValue: () => {
			throw new Error('Not supported, this should not happen.');
		},

		attributes: {},
	};
}

export function getVariableSetItemName(item: VariableSetItemRtv, variableSets: VariableSets) {
	if (!variableSets)
		return 'Unknown';

	const keys = TypedObject.keys(variableSets);

	for (const key of keys) {
		const vg = variableSets[key];
		const itemValue = vg.items[item.itemId];

		if (itemValue)
			return `${key} (${itemValue})`;
	}

	return 'Unknown';
}

export default definition;
