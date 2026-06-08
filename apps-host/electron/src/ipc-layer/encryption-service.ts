import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';
import { ipcMain } from 'electron';

import getRuntime from '../host';
import { getProjectId } from './utils';

const service = new IpcEncryptionServiceMain(ipcMain);

service.registerCheckStatus(async event => getRuntime().secrets.checkStatus(getProjectId(event)));

service.registerSubmitKey(async (event, { key }) => {
	await getRuntime().secrets.submitKey(getProjectId(event), key);

	return true;
});

service.registerResetKey(async event => {
	await getRuntime().secrets.resetKey(getProjectId(event));

	return true;
});

service.registerGenerateIv(async () => getRuntime().secrets.generateIv());

service.registerEncryptString(async (event, { iv, payload }) =>
	getRuntime().secrets.encryptString(getProjectId(event), iv, payload),
);

service.registerDecryptString(async (event, { iv, payload }) =>
	getRuntime().secrets.decryptString(getProjectId(event), iv, payload),
);

service.registerEncryptObject(async (event, { iv, payload }) =>
	getRuntime().secrets.encryptObject(getProjectId(event), iv, payload),
);

service.registerDecryptObject(async (event, { iv, payload }) =>
	getRuntime().secrets.decryptObject(getProjectId(event), iv, payload),
);

service.registerCopyEncryptionKey(async event => getRuntime().secrets.copyKeyToClipboard(getProjectId(event)));
