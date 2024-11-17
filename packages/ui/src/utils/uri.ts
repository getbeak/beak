import { TypedObject } from '@beak/common/helpers/typescript';
import type { RequestOverview } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';
import URL from 'url-parse';

import { parseValueSections } from '../features/variables/parser';

interface Options {
	includeQuery: boolean;
	includeHash: boolean;
}

export async function convertRequestToUrl(
	context: Context,
	info: RequestOverview,
	opts?: Partial<Options>,
) {
	const value = await parseValueSections(context, info.url);
	const url = new URL(value, true);
	const options = {
		includeQuery: true,
		...opts,
	};

	if (url.protocol === 'file:') {
		url.set('protocol', 'https:');
		url.set('host', 'httpbin.org');
	}

	url.set('query', void 0);

	if (options.includeQuery && info.query) {
		const outQuery: Record<string, string> = {};

		for (const query of TypedObject.values(info.query).filter(q => q.enabled)) {
			// eslint-disable-next-line no-await-in-loop
			outQuery[query.name] = await parseValueSections(context, query.value);
		}

		url.set('query', outQuery);
	}

	return url;
}
