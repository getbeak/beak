import AesProviderBase from '@beak/common-host/providers/encryption-aes';
import base64 from 'base64-js';

const textEncoder = new TextEncoder();

export default class AesProvider extends AesProviderBase {
	async generateKey(): Promise<string> {
		const key = await window.crypto.subtle.generateKey({
			name: 'AES-CTR',
			length: 256,
		}, true, ['encrypt', 'decrypt']);

		const exportedKey = await window.crypto.subtle.exportKey('raw', key);

		return base64.fromByteArray(new Uint8Array(exportedKey));
	}

	async generateIv(): Promise<string> {
		const iv = crypto.getRandomValues(new Uint8Array(16));

		return base64.fromByteArray(iv);
	}

	async encrypt(payload: Uint8Array, keyBase64: string, ivBase64: string): Promise<string> {
		const key = await window.crypto.subtle.importKey(
			'raw',
			base64.toByteArray(keyBase64),
			'AES-CTR',
			true,
			['encrypt', 'decrypt'],
		);

		const cipherText = await window.crypto.subtle.encrypt({
			name: 'AES-CTR',
			length: 256,
			counter: base64.toByteArray(ivBase64),
		}, key, payload);

		return base64.fromByteArray(new Uint8Array(cipherText));
	}

	async decrypt(payload: Uint8Array, keyBase64: string, ivBase64: string): Promise<string> {
		const key = await window.crypto.subtle.importKey(
			'raw',
			textEncoder.encode(atob(keyBase64)),
			'AES-CTR',
			true,
			['encrypt', 'decrypt'],
		);

		const decrypted = await window.crypto.subtle.decrypt({
			name: 'AES-CTR',
			length: 256,
			counter: textEncoder.encode(atob(ivBase64)),
		}, key, payload);

		return base64.fromByteArray(new Uint8Array(decrypted));
	}

	async encryptString(payload: string, key: string, iv: string): Promise<string> {
		const buf = textEncoder.encode(payload);

		return await this.encrypt(buf, key, iv);
	}

	async decryptString(payload: string, key: string, iv: string): Promise<string> {
		if (payload === '')
			return '';

		const buf = textEncoder.encode(payload);

		return await this.decrypt(buf, key, iv);
	}
}
