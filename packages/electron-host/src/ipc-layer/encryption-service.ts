import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';
import { clipboard, ipcMain } from 'electron';

import {
	decryptString,
	encryptString,
	generateIv,
	readProjectEncryptionKey,
	writeProjectEncryptionKey,
} from '../lib/aes';
import { getProjectFolder } from './utils';

const service = new IpcEncryptionServiceMain(ipcMain);

service.registerCheckStatus(async event => {
	const projectFolder = getProjectFolder(event);
	const key = await readProjectEncryptionKey(projectFolder);

	return key !== null;
});

service.registerSubmitKey(async (event, { key }) => {
	const projectFolder = getProjectFolder(event);

	return await writeProjectEncryptionKey(key, projectFolder);
});

service.registerGenerateIv(async () => generateIv());

service.registerEncryptString(async (event, { iv, payload }) => {
	const projectFolder = getProjectFolder(event);
	const key = await readProjectEncryptionKey(projectFolder);

	if (key === null)
		return '';

	return await encryptString(payload, key, iv);
});

service.registerDecryptString(async (event, { iv, payload }) => {
	const projectFolder = getProjectFolder(event);
	const key = await readProjectEncryptionKey(projectFolder);

	if (key === null)
		return '[Encryption key missing]';

	return await decryptString(payload, key, iv);
});

service.registerEncryptObject(async (event, { iv, payload }) => {
	const json = JSON.stringify(payload);
	const projectFolder = getProjectFolder(event);
	const key = await readProjectEncryptionKey(projectFolder);

	if (key === null)
		return '';

	return await encryptString(json, key, iv);
});

service.registerDecryptObject(async (event, { iv, payload }) => {
	const projectFolder = getProjectFolder(event);
	const key = await readProjectEncryptionKey(projectFolder);

	if (key === null)
		return '[Encryption key missing]';

	const decrypted = await decryptString(payload, key, iv);

	if (decrypted === '')
		return [];

	try {
		return JSON.parse(decrypted);
	} catch {
		return [];
	}
});

service.registerCopyEncryptionKey(async event => {
	const projectFolder = getProjectFolder(event);
	const key = await readProjectEncryptionKey(projectFolder);

	if (key)
		clipboard.writeText(key);
});
