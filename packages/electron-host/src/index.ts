import './ipc-layer';

import { app } from 'electron';

import persistentStore from './lib/persistent-store';
import { handleOpenUrl } from './lib/protocol';
import createMenu from './menu';
import { createOnboardingWindow, createWelcomeWindow, windowStack } from './window-management';

async function createDefaultWindow() {
	const user = persistentStore.get('user');

	if (!user)
		return createOnboardingWindow();

	return createWelcomeWindow();
}

createMenu();

app.setAsDefaultProtocolClient('beak-app');

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

app.on('open-url', (_event, url) => {
	const magicInfo = handleOpenUrl(url);

	if (!magicInfo)
		return;

	const { code, state } = magicInfo;
	const windowId = createOnboardingWindow();
	const window = windowStack[windowId];

	window.webContents.send('inbound-magic-link', { code, state });
});
