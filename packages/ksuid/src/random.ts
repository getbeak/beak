// https://github.com/junkurihara/jscu/blob/a1e305ff0c7583bca792fc2c712b9ae9fce81a5c/packages/js-crypto-random/src/random.ts

export function getRandomBytes(len: number): Uint8Array {
	const webCrypto = getWebCrypto();

	if (
		typeof webCrypto !== 'undefined' &&
		typeof webCrypto.getRandomValues === 'function'
	) {
		const array = new Uint8Array(len);
		webCrypto.getRandomValues(array);
		return array;
	}

	const nodeCrypto = getNodeCrypto();

	if (typeof nodeCrypto !== 'undefined') {
		return new Uint8Array(nodeCrypto.randomBytes(len));
	}

	throw new Error('UnsupportedEnvironment');
}

function getWebCrypto(): any | undefined {
	if (typeof global !== 'undefined' && global.crypto) {
		return global.crypto;
	}

	if (typeof window !== 'undefined' && window.crypto) {
		return window.crypto;
	}

	if (typeof crypto !== 'undefined') {
		// eslint-disable-next-line no-undef
		return crypto;
	}

	return undefined;
}

function getNodeCrypto(): any | undefined {
	const r = require;

	if (typeof r === 'undefined') {
		return undefined;
	}

	// indirect use of require to avoid Metro's dependency resolution
	return r('crypto');
}
