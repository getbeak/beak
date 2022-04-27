import { getReasonPhrase } from 'http-status-codes';

export function getStatusReasonPhrase(status: number) {
	try {
		return getReasonPhrase(status);
	} catch {
		return '';
	}
}

export function requestAllowsBody(verb: string) {
	return !['get', 'head'].includes(verb.toLowerCase());
}
