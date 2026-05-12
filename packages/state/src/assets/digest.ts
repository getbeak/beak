/**
 * Hex-encoded sha256 of a buffer using the platform WebCrypto API. Available
 * on `globalThis.crypto.subtle` in modern browsers and Node 20+. We keep the
 * function async to match the `SubtleCrypto.digest` signature; callers thread
 * the promise.
 *
 * This module deliberately avoids importing `node:crypto` so it stays usable
 * inside the renderer bundle without a polyfill.
 */
export async function sha256Hex(buffer: Uint8Array | ArrayBuffer): Promise<string> {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	const subtle = (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle;
	if (!subtle || typeof subtle.digest !== 'function') {
		throw new Error('WebCrypto SubtleCrypto.digest is unavailable in this runtime — cannot compute sha256');
	}
	// Slice to a plain ArrayBuffer so the type matches BufferSource exactly.
	// The cast handles the lib.d.ts widening to ArrayBufferLike (which would
	// otherwise include SharedArrayBuffer); our bytes are always plain.
	const view = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
	const digest = await subtle.digest('SHA-256', view);
	return hex(new Uint8Array(digest));
}

function hex(bytes: Uint8Array): string {
	let s = '';
	for (let i = 0; i < bytes.length; i++) {
		const v = bytes[i].toString(16);
		s += v.length === 1 ? `0${v}` : v;
	}
	return s;
}
