import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';
import { IpcEvent } from '@beak/common/ipc/ipc';
import { clipboard, ipcMain } from 'electron';
import path from 'path';

import {
	decryptString,
	encryptString,
	generateIv,
	readProjectEncryptionKey,
	writeProjectEncryptionKey,
} from '../lib/aes';
import { getProjectWindowMapping } from './fs-shared';

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

service.registerCopyEncryptionKey(async event => {
	const projectFolder = getProjectFolder(event);
	const key = await readProjectEncryptionKey(projectFolder);

	if (key)
		clipboard.writeText(key);
});

function getProjectFolder(event: IpcEvent) {
	const projectFilePath = getProjectWindowMapping(event);

	return path.join(projectFilePath, '..');
}
