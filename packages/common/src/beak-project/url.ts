import url from 'url';

import { TypedObject } from '../helpers/typescript';
import { RequestOverview } from './types';

interface Options {
	includeQuery: boolean;
	includeHash: boolean;
}

export function constructUri(info: RequestOverview, opts?: Options) {
	const options = {
		includeQuery: true,
		includeHash: true,
		...opts,
	};

	const {
		protocol,
		hostname,
		path: pathname,
		query,
		fragment,
	} = info.uri;

	const uriQuery = (() => {
		if (!query)
			return null;

		return TypedObject.values(query).filter(q => q.enabled)
			.reduce((acc, val) => ({
				...acc,
				[val.name]: val.value,
			}), {});
	})();

	const uri = url.format({
		protocol,
		hostname,
		pathname,
		query: options.includeQuery ? uriQuery : null,
		hash: options.includeHash ? fragment : null,
	});

	return new URL(uri).toString();
}
