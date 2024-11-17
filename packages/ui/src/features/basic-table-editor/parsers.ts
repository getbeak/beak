import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import type { ToggleKeyValue } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';

import { parseValueSections } from '../variables/parser';

const queryStringRegex = /[a-z0-9%=+-[\]]+/;

export async function convertKeyValueToString(context: Context, items: Record<string, ToggleKeyValue>) {
	const params = new URLSearchParams();
	const eligible = TypedObject.values(items).filter(i => i.enabled);
	const resolved = await Promise.all(eligible.map(async e => ({
		name: e.name,
		value: await parseValueSections(context, e.value),
	})));

	for (const resolve of resolved)
		params.set(resolve.name, resolve.value);

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
