import { IpcNestServiceMain, SetUserReq } from '@beak/common/ipc/nest';
import { ipcMain } from 'electron';

import persistentStore from '../lib/persistent-store';
import { createWelcomeWindow, stackMap, windowStack } from '../window-management';

const service = new IpcNestServiceMain(ipcMain);

service.registerSetUser(async (_event, payload: SetUserReq) => {
	const { userId, fromOnboarding } = payload;

	persistentStore.set('user', { userId });

	if (!fromOnboarding)
		return;

	// Close onboarding window
	windowStack[stackMap.onboarding]?.close();

	// Launch welcome window
	createWelcomeWindow();
});
