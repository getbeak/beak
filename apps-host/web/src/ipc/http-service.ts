import { type FetchTextReq, IpcHttpServiceMain } from '@beak/common/ipc/http';
import { fetchText } from '@beak/runtime-shared';

import { webIpcMain } from './ipc';

const service = new IpcHttpServiceMain(webIpcMain);

service.registerFetchText(async (_event, payload: FetchTextReq) =>
	// Web shell relies on the browser's fetch — CORS rules apply. No proxy
	// (there's no backend); users hitting CORS-locked specs should save
	// the file locally or use the desktop app. The error surface (status 0)
	// matches electron's either way. `res.text()` is fine here — the
	// browser's JS heap already enforces the memory ceiling electron caps
	// manually.
	fetchText(payload, { readBody: res => res.text() }),
);
