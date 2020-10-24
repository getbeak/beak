import * as url from 'url';

import { TypedObject } from '../helpers/typescript';
import { RequestOverview } from '../types/beak-project';

interface Options {
	useFallback: boolean;
	includeQuery: boolean;
	includeHash: boolean;
}

export function constructUri(info: RequestOverview, opts?: Partial<Options>) {
	const options = {
		includeQuery: true,
		includeHash: true,
		useFallback: true,
		...opts,
	};

	const {
		protocol,
		hostname,
		pathname,
		port,
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

	const urlOptions: url.UrlObject = {
		protocol,
		hostname,
		pathname,
		port,
		query: options.includeQuery ? uriQuery : null,
		hash: options.includeHash ? fragment : null,
	};

	if (options.useFallback) {
		if (urlOptions.protocol === '') urlOptions.protocol = 'https:';
		if (urlOptions.hostname === '') urlOptions.hostname = 'httpbin';

		if (!hostname && !pathname)
			urlOptions.pathname = 'anything';
		else
			urlOptions.pathname = pathname || '';
	}

	// TODO(afr): Fix weidness around protocol and two slashes
	return url.format(urlOptions).replace(/\[|\]/g, '');
}
