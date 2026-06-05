/**
 * Web Crypto helpers for the agent pairing flow and the discovery HMAC
 * challenge. Pure functions, no IO, no state. Used by both the pairing
 * and discovery services so the crypto choices stay in one place.
 */

const subtle = (): SubtleCrypto => {
	if (!window.crypto?.subtle) {
		throw new Error('Web Crypto SubtleCrypto unavailable — agent pairing requires a secure context');
	}
	return window.crypto.subtle;
};

export function randomBytes(length: number): Uint8Array {
	const buffer = new Uint8Array(length);
	window.crypto.getRandomValues(buffer);
	return buffer;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function sha256(input: string): Promise<Uint8Array> {
	const data = new TextEncoder().encode(input);
	const digest = await subtle().digest('SHA-256', data);
	return new Uint8Array(digest);
}

/**
 * `base64url(HMAC-SHA256(key=tokenUtf8Bytes, message=nonceUtf8Bytes))`.
 * The agent computes the same thing server-side; the renderer recomputes
 * and verifies to defeat localhost impostors at discovery time.
 */
export async function hmacSha256Base64Url(keyText: string, messageText: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await subtle().importKey(
		'raw',
		encoder.encode(keyText),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const signature = await subtle().sign('HMAC', key, encoder.encode(messageText));
	return bytesToBase64Url(new Uint8Array(signature));
}

export function newPkcePair(): { codeVerifier: string; codeChallengePromise: Promise<string> } {
	const codeVerifier = bytesToBase64Url(randomBytes(32));
	const codeChallengePromise = sha256(codeVerifier).then(bytesToBase64Url);
	return { codeVerifier, codeChallengePromise };
}

export function newState(): string {
	return bytesToBase64Url(randomBytes(16));
}
