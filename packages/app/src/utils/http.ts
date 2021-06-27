import { getReasonPhrase } from 'http-status-codes';

export function getStatusReasonPhrase(status: number) {
	try {
		return getReasonPhrase(status);
	} catch {
		return '';
	}
}
