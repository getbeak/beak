import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';
import { ipcMain } from 'electron';

import {
	decryptString,
	encryptString,
	generateIv,
	readProjectEncryptionKey,
	writeProjectEncryptionKey,
} from '../lib/aes';

const service = new IpcEncryptionServiceMain(ipcMain);

service.registerCheckStatus(async (_event, projectFolder) => {
	const key = await readProjectEncryptionKey(projectFolder);

	return key !== null;
});

service.registerSubmitKey(async (_event, { key, projectFolder }) =>
	await writeProjectEncryptionKey(key, projectFolder));

service.registerGenerateIv(async () => generateIv());

service.registerEncryptString(async (_event, { iv, payload, projectFolder }) => {
	const key = await readProjectEncryptionKey(projectFolder);

	if (key === null)
		return '';

	return await encryptString(payload, key, iv);
});

service.registerDecryptString(async (_event, { iv, payload, projectFolder }) => {
	const key = await readProjectEncryptionKey(projectFolder);

	if (key === null)
		return '[Encryption key missing]';

	return await decryptString(payload, key, iv);
});
