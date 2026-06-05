import { type FetchTextReq, IpcHttpServiceMain } from '@beak/common/ipc/http';
import { fetchText, makeCappedBodyReader } from '@beak/runtime-shared';
import { ipcMain } from 'electron';

const service = new IpcHttpServiceMain(ipcMain);

// 16MB ceiling — OpenAPI specs are small; the cap stops a compromised
// renderer asking Beak to hold a runaway download in memory.
const MAX_BODY_BYTES = 16 * 1024 * 1024;
const readBody = makeCappedBodyReader(MAX_BODY_BYTES);

service.registerFetchText(async (_event, payload: FetchTextReq) =>
	fetchText(payload, {
		readBody,
		defaultHeaders: { 'User-Agent': 'Beak/openapi-sync' },
	}),
);
