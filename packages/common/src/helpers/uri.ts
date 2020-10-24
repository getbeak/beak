import * as nodeUrl from 'url';
import * as URLParse from 'url-parse';

import { TypedObject } from '../helpers/typescript';
import { RequestOverview } from '../types/beak-project';

interface Options {
	useFallback: boolean;
	includeQuery: boolean;
	includeHash: boolean;
}

export function convertRequestToUrl(info: RequestOverview, opts?: Partial<Options>) {
	const url = new URLParse('', {}, false);
	const options = {
		includeQuery: true,
		includeHash: true,
		useFallback: true,
		...opts,
	};

	url.set('protocol', info.uri.protocol);
	url.set('hostname', info.uri.hostname || '');
	url.set('port', info.uri.port || '');
	url.set('pathname', info.uri.pathname || '');

	if (options.includeHash)
		url.set('hash', info.uri.fragment || '');

	if (options.includeQuery) {
		const query = (() => {
			if (!info.uri.query)
				return void 0;

			return TypedObject.values(info.uri.query).filter(q => q.enabled)
				.reduce((acc, val) => ({
					...acc,
					[val.name]: val.value,
				}), {});
		})();

		url.set('query', query);
	}

	if (options.useFallback) {
		if (info.uri.protocol === '') url.set('protocol', 'https:');
		if (info.uri.hostname === '') url.set('hostname', 'httpbin.org');

		if (!info.uri.hostname && !info.uri.pathname)
			url.set('pathname', 'anything');
	}

	return url;
}
