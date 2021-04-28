import base64 from 'base64-js';

export function toWebSafeBase64(arr: Uint8Array) {
	return base64
		.fromByteArray(arr)
		.replace(/[+]/g, '-')
		.replace(/[/]/g, '_')
		.replace(/[=]+$/, '');
}
