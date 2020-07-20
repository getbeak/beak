import { RequestInfo } from './types';

const url = window.require('url');

export function constructUri(info: RequestInfo) {
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
		query: query?.filter(q => q.enabled).reduce((acc, val) => ({
			...acc,
			[val.name]: val.value,
		}), {}),
		hash: fragment,
	});

	return new URL(uri).toString();
}
