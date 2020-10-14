import './ipc-layer';

import { app } from 'electron';

import createMenu from './menu';
import { createAboutWindow, createProjectMainWindow, createWelcomeWindow, windowStack } from './window-management';

const quickCreate = {
	project: createProjectMainWindow,
	welcome: createWelcomeWindow,
	about: createAboutWindow,
};

createMenu();

// Quit application when all windows are closed on macOS
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
});

app.on('activate', () => {
	if (Object.keys(windowStack).length === 0)
		quickCreate.welcome();
});

app.on('ready', () => {
	quickCreate.welcome();
});
