import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';
import { clipboard, ipcMain } from 'electron';
import { ValueSections } from 'packages/types/values';

import getBeakHost from '../host';
import { getProjectId } from './utils';

const service = new IpcEncryptionServiceMain(ipcMain);

service.registerCheckStatus(async event => {
	const projectId = getProjectId(event);
	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	return encryption !== null;
});

service.registerSubmitKey(async (event, { key }) => {
	const projectId = getProjectId(event);

	await getBeakHost().providers.credentials.setProjectEncryption(projectId, {
		key,
		algorithm: getBeakHost().providers.aes.aesAlgo,
	});

	return true;
});

service.registerGenerateIv(async () => await getBeakHost().providers.aes.generateIv());

service.registerEncryptString(async (event, { iv, payload }) => {
	const projectId = getProjectId(event);
	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	if (encryption === null)
		return '';

	return await getBeakHost().providers.aes.encryptString(payload, encryption.key, iv);
});

service.registerDecryptString(async (event, { iv, payload }): Promise<string> => {
	const projectId = getProjectId(event);
	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	if (encryption === null)
		return '[Encryption key missing]';

	return await getBeakHost().providers.aes.decryptString(payload, encryption.key, iv);
});

service.registerEncryptObject(async (event, { iv, payload }) => {
	const json = JSON.stringify(payload);
	const projectId = getProjectId(event);
	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	if (encryption === null)
		return '';

	return await getBeakHost().providers.aes.encryptString(json, encryption.key, iv);
});

service.registerDecryptObject(async (event, { iv, payload }): Promise<ValueSections> => {
	const projectId = getProjectId(event);
	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	if (encryption === null)
		return ['[Encryption key missing]'];

	const decrypted = await getBeakHost().providers.aes.decryptString(payload, encryption.key, iv);

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
	const projectId = getProjectId(event);
	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	if (encryption)
		clipboard.writeText(encryption.key);
});
