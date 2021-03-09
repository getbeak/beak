import { TypedObject } from '@beak/common/helpers/typescript';
import { RequestOverview, VariableGroups } from '@beak/common/types/beak-project';

import { parseValueParts } from '../features/variable-input/parser';

interface Options {
	includeQuery: boolean;
	includeHash: boolean;
}

export async function convertRequestToUrl(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	info: RequestOverview,
	opts?: Partial<Options>,
) {
	const value = await parseValueParts(selectedGroups, variableGroups, info.url);
	const url = new URL(value);
	const options = {
		includeQuery: true,
		...opts,
	};

	if (options.includeQuery && info.query) {
		for (const query of TypedObject.values(info.query).filter(q => q.enabled)) {
			url.searchParams.set(
				query.name,
				await parseValueParts(selectedGroups, variableGroups, query.value),
			);
		}
	}

	return url;
}
