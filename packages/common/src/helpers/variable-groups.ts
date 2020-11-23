import { TypedObject } from '@beak/common/helpers/typescript';
import { ValueParts, VariableGroups } from '@beak/common/types/beak-project';

export function parsePartsValue(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	parts: ValueParts,
) {
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

		const value = getValueString(selectedGroups, variableGroups, part.payload.itemId);

		if (value)
			out.push(getValueString(selectedGroups, variableGroups, part.payload.itemId));
	}

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
