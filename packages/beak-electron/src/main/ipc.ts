import { ipcMain } from 'electron';

import { createProjectMainWindow } from './window-management';

ipcMain.on('project-open', (_, args) => {
	const filePath = args as string;

	createProjectMainWindow(filePath);
});
