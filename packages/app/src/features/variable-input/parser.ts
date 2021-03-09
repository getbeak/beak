import { TypedObject } from '@beak/common/helpers/typescript';
import { ValueParts, VariableGroups } from '@beak/common/types/beak-project';

import { getRealtimeValue } from './realtime-values';

export async function parseValueParts(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	parts: ValueParts,
) {
	const out = await Promise.all(parts.map(p => {
		if (typeof p === 'string')
			return p;

		if (typeof p !== 'object')
			throw new Error('Unknown part type');

		const rtv = getRealtimeValue(p.type);

		return rtv.getValue(p.payload, variableGroups, selectedGroups);
	}));

	return out.join('');
}

export function getValueString(selectedGroups: Record<string, string>, variableGroups: VariableGroups, itemId: string) {
	return getValueObject(selectedGroups, variableGroups, itemId)?.value;
}

export function getValueObject(selectedGroups: Record<string, string>, variableGroups: VariableGroups, itemId: string) {
	for (const key of TypedObject.keys(variableGroups)) {
		const variableGroup = variableGroups[key];
		const selectedGroup = selectedGroups[key];
		const value = TypedObject.values(variableGroup.values)
			.find(v => v.groupId === selectedGroup && v.itemId === itemId);

		if (value)
			return value;
	}

	return null;
}
