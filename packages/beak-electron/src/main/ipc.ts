import { ipcMain } from 'electron';

import { closeWindow, createProjectMainWindow } from './window-management';

ipcMain.handle('project-open', (_, args) => {
	const filePath = args as string;

	createProjectMainWindow(filePath);
});

ipcMain.handle('close-window', (_, args) => {
	const windowId = args as string;

	closeWindow(windowId);
});
