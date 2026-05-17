import getRuntime from '@beak/apps-host-web/host';
import { IpcValuesServiceMain, type LoadValuesRes, type SaveValuesReq } from '@beak/common/ipc/values';

import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

const service = new IpcValuesServiceMain(webIpcMain);

function projectRoot(): string {
	const folder = getCurrentProjectFolder();
	if (!folder) throw new Error('values: no project loaded');
	return folder;
}

service.registerLoad(async () => {
	const parsed = await getRuntime().values.read(projectRoot());
	const response: LoadValuesRes = { values: parsed };
	return response;
});

service.registerSave(async (_event, payload: SaveValuesReq) => {
	await getRuntime().values.write(projectRoot(), payload.values);
});
