import './ipc-layer';

import { app } from 'electron';

import persistentStore from './lib/persistent-store';
import createMenu from './menu';
import {
	createAboutWindow,
	createOnboardingWindow,
	createProjectMainWindow,
	createVariableGroupEditorWindow,
	createWelcomeWindow,
	windowStack,
} from './window-management';

async function createDefaultWindow() {
	// const user = persistentStore.get('user');

	// if (!user)
	// 	return createOnboardingWindow();

	return createWelcomeWindow();
}

createMenu();

// Quit application when all windows are closed on macOS
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
});

app.on('activate', () => {
	if (Object.keys(windowStack).length === 0)
		createDefaultWindow();
});

app.on('ready', () => {
	createDefaultWindow();
});
