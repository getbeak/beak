import * as URLParse from 'url-parse';

import { TypedObject } from '../helpers/typescript';
import { RequestOverview, VariableGroups } from '../types/beak-project';
import { parsePartsValue } from './variable-groups';

interface Options {
	includeQuery: boolean;
	includeHash: boolean;
}

export function convertRequestToUrl(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	info: RequestOverview,
	opts?: Partial<Options>,
) {
	const value = parsePartsValue(selectedGroups, variableGroups, info.url);
	const url = new URLParse(value, {}, false);
	const options = {
		includeQuery: true,
		includeHash: true,
		...opts,
	};

	if (!options.includeHash)
		url.set('hash', void 0);

	if (options.includeQuery) {
		const query = (() => {
			if (!info.query)
				return void 0;

			return TypedObject.values(info.query).filter(q => q.enabled)
				.reduce((acc, val) => ({
					...acc,
					[val.name]: parsePartsValue(selectedGroups, variableGroups, val.value),
				}), {});
		})();

		url.set('query', query);
	}

	return url;
}
