import { SupersecretFile } from '@beak/common/types/beak-project';
import crypto, { Cipher, Decipher } from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';

const aesAlgo = 'aes-256-ctr'; // 256 bit counter, very nice :borat:
const scrypt = promisify(crypto.scrypt);

export const encryptionAlgoVersions: Record<string, string> = {
	'2020-01-25': aesAlgo,
};

export async function generateKey() {
	const password = crypto.randomBytes(32);
	const salt = crypto.randomBytes(16);
	const key = await scrypt(password, salt, 32) as Buffer;

	return key.toString('base64');
}

export function generateIv() {
	const iv = crypto.randomBytes(16);

	return iv.toString('base64');
}

export async function encrypt(payload: Buffer, key: string, iv: string) {
	const keyBuffer = Buffer.from(key, 'base64');
	const ivBuffer = Buffer.from(iv, 'base64');

	const cipher = crypto.createCipheriv(aesAlgo, keyBuffer, ivBuffer, void 0) as Cipher;
	const update = cipher.update(payload);
	const final = Buffer.concat([update, cipher.final()]);

	return final.toString('base64');
}

export async function encryptString(payload: string, key: string, iv: string) {
	const buf = Buffer.from(payload, 'utf-8');

	return await encrypt(buf, key, iv);
}

export async function decrypt(payload: Buffer, key: string, iv: string) {
	const keyBuffer = Buffer.from(key, 'base64');
	const ivBuffer = Buffer.from(iv, 'base64');

	const decipher = crypto.createDecipheriv(aesAlgo, keyBuffer, ivBuffer, void 0) as Decipher;
	const update = decipher.update(payload);
	const final = Buffer.concat([update, decipher.final()]);

	return final.toString('utf-8');
}

export async function decryptString(payload: string, key: string, iv: string) {
	if (payload === '')
		return '';

	const buf = Buffer.from(payload, 'base64');

	return await decrypt(buf, key, iv);
}

export async function readProjectEncryptionKey(projectPath: string) {
	const supersecretFile = path.join(projectPath, '.beak', 'supersecret.json');

	// eslint-disable-next-line no-sync
	if (!fs.existsSync(supersecretFile))
		return null;

	const file = await fs.readJson(supersecretFile) as SupersecretFile;

	return file.encryption.key;
}

export async function writeProjectEncryptionKey(key: string, projectPath: string) {
	const supersecretFilePath = path.join(projectPath, '.beak', 'supersecret.json');
	const supersecretFile: SupersecretFile = {
		encryption: {
			algo: aesAlgo,
			key,
		},
	};

	await fs.writeJson(supersecretFilePath, supersecretFile, { spaces: '\t' });

	return true;
}
