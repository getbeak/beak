import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';
import { ipcMain } from 'electron';

import { decryptString, encryptString, generateIv, readProjectEncryptionKey } from '../lib/aes';

const service = new IpcEncryptionServiceMain(ipcMain);

service.registerGenerateIv(async () => generateIv());

service.registerEncryptString(async (_event, { iv, payload, projectFolder }) => {
	const key = await readProjectEncryptionKey(projectFolder);

	return await encryptString(payload, key, iv);
});

service.registerDecryptString(async (_event, { iv, payload, projectFolder }) => {
	const key = await readProjectEncryptionKey(projectFolder);

	return await decryptString(payload, key, iv);
});
