import { IpcEncryptionServiceMain } from '@beak/common/ipc/encryption';

import getRuntime from '../host';
import { webIpcMain } from './ipc';
import { getCurrentProjectId } from './utils';

const service = new IpcEncryptionServiceMain(webIpcMain);

service.registerCheckStatus(async () => {
	const projectId = getCurrentProjectId();

	if (!projectId) return false;

	return getRuntime().secrets.checkStatus(projectId);
});

service.registerSubmitKey(async (_event, { key }) => {
	const projectId = getCurrentProjectId();

	if (!projectId) return false;

	await getRuntime().secrets.submitKey(projectId, key);

	return true;
});

service.registerResetKey(async () => {
	const projectId = getCurrentProjectId();

	if (!projectId) return false;

	await getRuntime().secrets.resetKey(projectId);

	return true;
});

service.registerGenerateIv(async () => getRuntime().secrets.generateIv());

service.registerEncryptString(async (_event, { iv, payload }) => {
	const projectId = getCurrentProjectId();

	if (!projectId) return '';

	return getRuntime().secrets.encryptString(projectId, iv, payload);
});

service.registerDecryptString(async (_event, { iv, payload }) => {
	const projectId = getCurrentProjectId();

	if (!projectId) return '[Project not loaded]';

	return getRuntime().secrets.decryptString(projectId, iv, payload);
});

service.registerEncryptObject(async (_event, { iv, payload }) => {
	const projectId = getCurrentProjectId();

	if (!projectId) return '';

	return getRuntime().secrets.encryptObject(projectId, iv, payload);
});

service.registerDecryptObject(async (_event, { iv, payload }) => {
	const projectId = getCurrentProjectId();

	if (!projectId) return ['Project not loaded'];

	return getRuntime().secrets.decryptObject(projectId, iv, payload);
});

service.registerCopyEncryptionKey(async () => {
	const projectId = getCurrentProjectId();

	if (!projectId) return;

	await getRuntime().secrets.copyKeyToClipboard(projectId);
});
