import { app } from 'electron';

import createMenu from './menu';
import { createProjectMainWindow, windowStack } from './window-management';

createMenu();

// Quit application when all windows are closed on macOS
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
});

app.on('activate', () => {
	if (Object.keys(windowStack).length === 0)
		createProjectMainWindow();
});

app.on('ready', () => {
	createProjectMainWindow();
});
