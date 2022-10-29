import keytar from 'keytar';
import os from 'os';

import { generateIv, generateKey } from './aes';

export const credentialKeys = {
	authEncryptionKey: 'app.getbeak.beak.auth-encryption-key',
	projectEncryptionPrefix: 'app.getbeak.beak.project-encryption',
} as const;

export async function getProjectEncryption(projectId: string) {
	const key = [credentialKeys.projectEncryptionPrefix, projectId].join('.');

	return await getValue(key);
}

export async function setProjectEncryption(projectId: string, encryption: string) {
	const key = [credentialKeys.projectEncryptionPrefix, projectId].join('.');

	await setKeyValue(key, encryption);
}

export async function getOrCreateBeakAuthEncryptionKey(): Promise<[string, string]> {
	const storedKey = await getValue(credentialKeys.authEncryptionKey);

	if (storedKey) {
		const [key, iv] = storedKey.split(':');

		if (key && iv)
			return [key, iv];
	}

	const key = await generateKey();
	const iv = generateIv();

	await setBeakAuthEncryptionKey(`${key}:${iv}`);

	return [key, iv];
}

export async function setBeakAuthEncryptionKey(authEncryptionKey: string) {
	return await setKeyValue(credentialKeys.authEncryptionKey, authEncryptionKey);
}

async function getValue(key: string) {
	return await keytar.getPassword(key, os.userInfo().username);
}

async function setKeyValue(key: string, value: string) {
	await keytar.setPassword(key, os.userInfo().username, value);
}
