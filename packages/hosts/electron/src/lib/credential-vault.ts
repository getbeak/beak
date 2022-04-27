import keytar from 'keytar';
import os from 'os';

export const credentialKeys = {
	auth: 'app.getbeak.beak.auth',
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

export async function getBeakAuth() {
	return await getValue(credentialKeys.auth);
}

export async function setBeakAuth(authData: string) {
	return await setKeyValue(credentialKeys.auth, authData);
}

async function getValue(key: string) {
	return await keytar.getPassword(os.userInfo().username, key);
}

async function setKeyValue(key: string, value: string) {
	await keytar.setPassword(os.userInfo().username, key, value);
}
