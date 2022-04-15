import { dialog } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';

import logger from './lib/logger';
import { createAndSetMenu } from './utils/menu';

autoUpdater.logger = logger;
autoUpdater.autoDownload = true;

// We only want to show the user this when the update is ready to go
autoUpdater.on('update-downloaded', async (event: UpdateInfo) => {
	// Update menu to say update is ready
	createAndSetMenu();

	const { response } = await dialog.showMessageBox({
		type: 'info',
		title: 'Update available',
		message: `Version ${event.version} of Beak is now available!`,
		detail: 'Grab it while it\'s hot',
		buttons: ['Update on next launch', 'Update now'],
		cancelId: 0,
		defaultId: 1,
	});

	if (response === 1)
		autoUpdater.quitAndInstall();
});
