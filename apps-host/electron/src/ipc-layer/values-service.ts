import path from 'node:path';

import getRuntime from '@beak/apps-host-electron/host';
import { IpcValuesServiceMain, type LoadValuesRes, type SaveValuesReq } from '@beak/common/ipc/values';
import { ipcMain } from 'electron';

import { getProjectFilePathWindowMapping } from './fs-shared';

/**
 * Persistence handler for the per-project request values store
 * (`.beak/values.json`). Values are scoped to the project bound to the
 * invoking renderer window — there's no cross-project leak vector here.
 */
const service = new IpcValuesServiceMain(ipcMain);

function projectRootFromEvent(event: Electron.IpcMainInvokeEvent): string {
	const projectFilePath = getProjectFilePathWindowMapping(event);
	if (!projectFilePath) throw new Error('values: no project bound to this window');
	return path.dirname(projectFilePath);
}

service.registerLoad(async event => {
	const projectRoot = projectRootFromEvent(event);
	const parsed = await getRuntime().values.read(projectRoot);
	const response: LoadValuesRes = { values: parsed };
	return response;
});

service.registerSave(async (event, payload: SaveValuesReq) => {
	const projectRoot = projectRootFromEvent(event);
	await getRuntime().values.write(projectRoot, payload.values);
});
