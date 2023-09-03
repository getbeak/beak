import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';
import { ValueParts } from 'packages/types/values';

import getBeakHost from '../host';
import { webIpcMain } from './ipc';
import { getCurrentProjectId } from './utils';

const service = new IpcEncryptionServiceMain(webIpcMain);

service.registerCheckStatus(async () => {
	const projectId = getCurrentProjectId();

	if (!projectId) return false;

	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectId);

	return key !== null;
});

service.registerSubmitKey(async (_event, { key }) => {
	const projectId = getCurrentProjectId();

	if (!projectId) return false;

	await getBeakHost().providers.credentials.setProjectEncryptionKey(key, projectId);

	return true;
});

service.registerGenerateIv(async () => await getBeakHost().providers.aes.generateIv());

service.registerEncryptString(async (_event, { iv, payload }) => {
	const projectId = getCurrentProjectId();

	if (!projectId) return '';

	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectId);

	if (key === null)
		return '';

	return await getBeakHost().providers.aes.encryptString(payload, key, iv);
});

service.registerDecryptString(async (_event, { iv, payload }): Promise<string> => {
	const projectId = getCurrentProjectId();

	if (!projectId) return '[Project not loaded]';

	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectId);

	if (key === null)
		return '[Encryption key missing]';

	return await getBeakHost().providers.aes.decryptString(payload, key, iv);
});

service.registerEncryptObject(async (_event, { iv, payload }) => {
	const json = JSON.stringify(payload);
	const projectId = getCurrentProjectId();

	if (!projectId) return '';

	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectId);

	if (key === null)
		return '';

	return await getBeakHost().providers.aes.encryptString(json, key, iv);
});

service.registerDecryptObject(async (_event, { iv, payload }): Promise<ValueParts> => {
	const projectId = getCurrentProjectId();

	if (!projectId) return ['Project not loaded'];

	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectId);

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

service.registerCopyEncryptionKey(async _event => {
	const projectId = getCurrentProjectId();

	if (!projectId) return;

	const key = await getBeakHost().providers.credentials.getProjectEncryptionKey(projectId);

	if (key)
		await navigator.clipboard.writeText(key);
});
