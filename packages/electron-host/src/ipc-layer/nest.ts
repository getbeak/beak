import { ipcMain } from 'electron';

import persistentStore from '../lib/persistent-store';
import { createWelcomeWindow, stackMap, windowStack } from '../window-management';

ipcMain.on('nest:set_user', (_event, userId: string, fromOnboarding = false) => {
	persistentStore.set('user', { userId });

	if (!fromOnboarding)
		return;

	// Close onboarding window
	windowStack[stackMap.onboarding]?.close();

	// Launch welcome window
	createWelcomeWindow();
});
