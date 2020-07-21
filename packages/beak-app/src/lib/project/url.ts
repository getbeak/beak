import { RequestInfo } from './types';

const url = window.require('url');

interface Options {
	includeQuery: boolean;
	includeHash: boolean;
}

export function constructUri(info: RequestInfo, opts?: Options) {
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

	const uri = url.format({
		protocol,
		hostname,
		pathname,
		query: options.includeQuery ? query?.filter(q => q.enabled).reduce((acc, val) => ({
			...acc,
			[val.name]: val.value,
		}), {}) : null,
		hash: options.includeHash ? fragment : null,
	});

	return new URL(uri).toString();
}
