import { TypedObject } from '@beak/common/helpers/typescript';
import { RequestOverview } from '@beak/common/types/beak-project';
import URL from 'url-parse';

import { parseValueParts } from '../features/realtime-values/parser';
import { Context } from '../features/realtime-values/types';

interface Options {
	includeQuery: boolean;
	includeHash: boolean;
}

export async function convertRequestToUrl(
	context: Context,
	info: RequestOverview,
	opts?: Partial<Options>,
) {
	const value = await parseValueParts(context, info.url);
	const url = new URL(value);
	const options = {
		includeQuery: true,
		...opts,
	};

	if (options.includeQuery && info.query) {
		url.set('query', { });

		for (const query of TypedObject.values(info.query).filter(q => q.enabled)) {
			// eslint-disable-next-line no-await-in-loop
			url.query[query.name] = await parseValueParts(context, query.value);
		}
	}

	return url;
}
