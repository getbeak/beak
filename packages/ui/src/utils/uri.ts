import { TypedObject } from '@beak/common/helpers/typescript';
import type { RequestOverview } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';
import URL from 'url-parse';

import { parseValueSections } from '../features/variables/parser';

interface Options {
	includeQuery: boolean;
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
		const entries = TypedObject.values(info.query).filter(q => q.enabled);
		const resolved = await Promise.all(
			entries.map(async q => [q.name, await parseValueSections(context, q.value)] as const),
		);

		// URLSearchParams.append (not set) so two params with the same name
		// both appear in the resulting `?foo=1&foo=2` — the previous
		// object-keyed accumulator silently dropped duplicates.
		const params = new URLSearchParams();
		for (const [name, val] of resolved) params.append(name, val);

		url.set('query', params.toString());
	}

	return url;
}
