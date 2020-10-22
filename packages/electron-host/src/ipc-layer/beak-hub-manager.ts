import { ipcMain } from 'electron';

import { listRecentProjects } from '../lib/beak-hub';

ipcMain.handle('beak_hub:list_recents', async () => await listRecentProjects());

ipcMain.handle('beak_hub:get_request_preference', async (_event, args) => {
	const requestId = args as string;

	// return await getRequestPreference(requestId);
});

ipcMain.handle('beak_hub:set_request_preference', async (_event, requestId, reqPrefDiff) => {
	// const existing = await getRequestPreference(requestId);

	// await setRequestPreference(requestId, {
	// 	...existing,
	// 	...reqPrefDiff,
	// });
});
