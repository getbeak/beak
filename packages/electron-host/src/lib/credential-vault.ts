import keytar from 'keytar';
import os from 'os';

export const credentialKeys = {
	auth: 'app.getbeak.beak.auth',
} as const;

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
