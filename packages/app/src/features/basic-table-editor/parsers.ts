import { TypedObject } from '@beak/common/helpers/typescript';
import { ToggleKeyValue, VariableGroups } from '@beak/common/types/beak-project';
// @ts-ignore
import ksuid from '@cuvva/ksuid';

import { parseValueParts } from '../variable-input/parser';

const queryStringRegex = /[a-z0-9%=+-[\]]+/;

export async function convertKeyValueToString(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	items: Record<string, ToggleKeyValue>,
) {
	const params = new URLSearchParams();

	for (const { name, value } of TypedObject.values(items).filter(i => i.enabled))
		params.set(name, await parseValueParts(selectedGroups, variableGroups, value));

	return params.toString();
}

export function convertStringToKeyValue(str: string, resource: string) {
	if (!queryStringRegex.test(str))
		return {};

	const params = new URLSearchParams(str);
	const items: Record<string, ToggleKeyValue> = {};

	for (const [key, value] of params) {
		items[ksuid.generate(resource).toString()] = {
			name: key,
			value: [value],
			enabled: true,
		};
	}

	return items;
}
