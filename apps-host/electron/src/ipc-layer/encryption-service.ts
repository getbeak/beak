import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';
import { clipboard, ipcMain } from 'electron';
import { ValueParts } from 'packages/types/values';

import getBeakHost from '../host';
import { getProjectFolder } from './utils';

const service = new IpcEncryptionServiceMain(ipcMain);

service.registerCheckStatus(async event => {
	const projectFolder = getProjectFolder(event);
	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectFolder);

	return key !== null;
});

service.registerSubmitKey(async (event, { key }) => {
	const projectFolder = getProjectFolder(event);

	await getBeakHost().providers.credentials.setProjectEncryptionKey(key, projectFolder);

	return true;
});

service.registerGenerateIv(async () => await getBeakHost().providers.aes.generateIv());

service.registerEncryptString(async (event, { iv, payload }) => {
	const projectFolder = getProjectFolder(event);
	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectFolder);

	if (key === null)
		return '';

	return await getBeakHost().providers.aes.encryptString(payload, key, iv);
});

service.registerDecryptString(async (event, { iv, payload }): Promise<string> => {
	const projectFolder = getProjectFolder(event);
	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectFolder);

	if (key === null)
		return '[Encryption key missing]';

	return await getBeakHost().providers.aes.decryptString(payload, key, iv);
});

service.registerEncryptObject(async (event, { iv, payload }) => {
	const json = JSON.stringify(payload);
	const projectFolder = getProjectFolder(event);
	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectFolder);

	if (key === null)
		return '';

	return await getBeakHost().providers.aes.encryptString(json, key, iv);
});

service.registerDecryptObject(async (event, { iv, payload }): Promise<ValueParts> => {
	const projectFolder = getProjectFolder(event);
	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectFolder);

	if (key === null)
		return ['[Encryption key missing]'];

	const decrypted = await getBeakHost().providers.aes.decryptString(payload, key, iv);

	if (decrypted === '')
		return [];

	try {
		const parsed = JSON.parse(decrypted);

		if (Array.isArray(parsed))
			return parsed;

		return [parsed];
	} catch {
		return [];
	}
});

service.registerCopyEncryptionKey(async event => {
	const projectFolder = getProjectFolder(event);
	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectFolder);

	if (key)
		clipboard.writeText(key);
});
