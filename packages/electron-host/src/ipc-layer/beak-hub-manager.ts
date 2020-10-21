import { listRecentProjects } from '@beak/common/beak-hub/recents';
import { getRequestPreference, setRequestPreference } from '@beak/common/beak-hub/request-preferences';
import { ipcMain } from 'electron';

ipcMain.handle('beak_hub:list_recents', async () => await listRecentProjects());

ipcMain.handle('beak_hub:get-request-preference', async (_event, args) => {
	const requestId = args as string;

	return await getRequestPreference(requestId);
});

ipcMain.handle('beak_hub:set-request_preference', async (_event, requestId, reqPrefDiff) => {
	const existing = await getRequestPreference(requestId);

	await setRequestPreference(requestId, {
		...existing,
		...reqPrefDiff,
	});
});
