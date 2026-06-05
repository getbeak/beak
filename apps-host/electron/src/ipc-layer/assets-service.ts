import path from 'node:path';

import getRuntime from '@beak/apps-host-electron/host';
import {
	type AssetRefDto,
	type ExistsAssetReq,
	type ExistsAssetRes,
	IpcAssetsServiceMain,
	type ReadAssetReq,
	type ReadAssetRes,
	type WriteAssetReq,
	type WriteAssetRes,
} from '@beak/common/ipc/assets';
import { ipcMain } from 'electron';

import { getProjectFilePathWindowMapping } from './fs-shared';

const service = new IpcAssetsServiceMain(ipcMain);

function projectRootFromEvent(event: Electron.IpcMainInvokeEvent): string {
	const projectFilePath = getProjectFilePathWindowMapping(event);
	if (!projectFilePath) throw new Error('assets: no project bound to this window');
	return path.dirname(projectFilePath);
}

service.registerWrite(async (event, payload: WriteAssetReq) => {
	const projectRoot = projectRootFromEvent(event);
	const ref = await getRuntime().assets.write(projectRoot, payload.bytes, payload.contentType);

	const relativePath = `_assets/${ref.sha256.slice(0, 2)}/${ref.sha256}`;
	const response: WriteAssetRes = { ref, relativePath };
	return response;
});

service.registerRead(async (event, payload: ReadAssetReq) => {
	const projectRoot = projectRootFromEvent(event);
	const bytes = await getRuntime().assets.read(projectRoot, dtoToRef(payload.ref));
	const response: ReadAssetRes = { bytes };
	return response;
});

service.registerExists(async (event, payload: ExistsAssetReq) => {
	const projectRoot = projectRootFromEvent(event);
	const exists = await getRuntime().assets.exists(projectRoot, dtoToRef(payload.ref));
	const response: ExistsAssetRes = { exists };
	return response;
});

function dtoToRef(ref: AssetRefDto) {
	return {
		sha256: ref.sha256,
		size: ref.size,
		...(ref.contentType ? { contentType: ref.contentType } : {}),
	};
}
