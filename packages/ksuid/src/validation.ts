import { prefixRegex } from './constants';

export function checkPrefix(field: string, value: string) {
	if (!prefixRegex.test(value))
		throw new Error(`${field} must be a valid prefix`);
}

export function checkUint(field: string, value: number, byteLength: number) {
	if (!Number.isInteger(value))
		throw new Error(`${field} must be an integer`);

	if (value < 0)
		throw new Error(`${field} must be positive`);

	if (value >= Math.pow(2, byteLength * 8))
		throw new Error(`${field} must be a uint${byteLength * 8}`);
}

export function checkUint8Array(
	field: string,
	value: Uint8Array,
	byteLength: number,
) {
	if (value.length !== byteLength)
		throw new Error(`${field} must be ${byteLength} bytes`);
}
