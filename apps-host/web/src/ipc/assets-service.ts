import getRuntime from '@beak/apps-host-web/host';
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

import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

const service = new IpcAssetsServiceMain(webIpcMain);

function projectRoot(): string {
	const folder = getCurrentProjectFolder();
	if (!folder) throw new Error('assets: no project loaded');
	return folder;
}

service.registerWrite(async (_event, payload: WriteAssetReq) => {
	const ref = await getRuntime().assets.write(projectRoot(), payload.bytes, payload.contentType);
	const response: WriteAssetRes = {
		ref,
		relativePath: `_assets/${ref.sha256.slice(0, 2)}/${ref.sha256}`,
	};
	return response;
});

service.registerRead(async (_event, payload: ReadAssetReq) => {
	const bytes = await getRuntime().assets.read(projectRoot(), dtoToRef(payload.ref));
	const response: ReadAssetRes = { bytes };
	return response;
});

service.registerExists(async (_event, payload: ExistsAssetReq) => {
	const exists = await getRuntime().assets.exists(projectRoot(), dtoToRef(payload.ref));
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
