import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { ValueParts, VariableGroups } from '@beak/common/dist/types/beak-project';

const selectedGroup = 'group_000000C1Dk7PnLNyP4cdGzrVFy6fB';

export function parsePartsValue(variableGroups: VariableGroups, parts: ValueParts) {
	const out = [];

	for (const part of parts) {
		if (typeof part === 'string') {
			out.push(part);

			continue;
		}

		if (typeof part !== 'object')
			throw new Error('unknown part type');

		if (part.type !== 'variable_group_item') {
			out.push('');

			continue;
		}

		out.push(getValueString(variableGroups, part.payload.itemId));
	}

	return out.join('');
}

export function getValueString(variableGroups: VariableGroups, itemId: string) {
	return getValueObject(variableGroups, itemId)?.value;
}

export function getValueObject(variableGroups: VariableGroups, itemId: string) {
	for (const key of TypedObject.keys(variableGroups)) {
		const variableGroup = variableGroups[key];
		const value = TypedObject.values(variableGroup.values)
			.find(v => v.groupId === selectedGroup && v.itemId === itemId);

		if (value)
			return value;
	}

	return null;
}
