import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';
import { ValueParts } from 'packages/types/values';

import getBeakHost from '../host';
import { webIpcMain } from './ipc';
import { getCurrentProjectId } from './utils';

const service = new IpcEncryptionServiceMain(webIpcMain);

service.registerCheckStatus(async () => {
	const projectId = getCurrentProjectId();

	if (!projectId) return false;

	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	return encryption !== null;
});

service.registerSubmitKey(async (_event, { key }) => {
	const projectId = getCurrentProjectId();

	if (!projectId) return false;

	await getBeakHost().providers.credentials.setProjectEncryption(projectId, {
		key,
		algorithm: getBeakHost().providers.aes.aesAlgo,
	});

	return true;
});

service.registerGenerateIv(async () => await getBeakHost().providers.aes.generateIv());

service.registerEncryptString(async (_event, { iv, payload }) => {
	const projectId = getCurrentProjectId();

	if (!projectId) return '';

	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	if (encryption === null)
		return '';

	return await getBeakHost().providers.aes.encryptString(payload, encryption.key, iv);
});

service.registerDecryptString(async (_event, { iv, payload }): Promise<string> => {
	const projectId = getCurrentProjectId();

	if (!projectId) return '[Project not loaded]';

	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	if (encryption === null)
		return '[Encryption key missing]';

	return await getBeakHost().providers.aes.decryptString(payload, encryption.key, iv);
});

service.registerEncryptObject(async (_event, { iv, payload }) => {
	const json = JSON.stringify(payload);
	const projectId = getCurrentProjectId();

	if (!projectId) return '';

	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	if (encryption === null)
		return '';

	return await getBeakHost().providers.aes.encryptString(json, encryption.key, iv);
});

service.registerDecryptObject(async (_event, { iv, payload }): Promise<ValueParts> => {
	const projectId = getCurrentProjectId();

	if (!projectId) return ['Project not loaded'];

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

service.registerCopyEncryptionKey(async _event => {
	const projectId = getCurrentProjectId();

	if (!projectId) return;

	const encryption = await getBeakHost().providers.credentials.getProjectEncryption(projectId);

	if (encryption)
		await navigator.clipboard.writeText(encryption.key);
});
