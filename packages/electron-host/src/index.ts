import './ipc-layer';

import { app } from 'electron';
import electronDebug from 'electron-debug';
import { autoUpdater } from 'electron-updater';

import persistentStore from './lib/persistent-store';
import { handleOpenUrl } from './lib/protocol';
import createMenu from './menu';
import { appIsPackaged } from './utils/static-path';
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
	autoUpdater.checkForUpdatesAndNotify();

	if (appIsPackaged)
		return;

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const {
		default: installExtension,
		REDUX_DEVTOOLS,
		REACT_DEVELOPER_TOOLS,
	} = require('electron-devtools-installer');

	electronDebug();
	installExtension(REDUX_DEVTOOLS);
	installExtension(REACT_DEVELOPER_TOOLS);
});

app.on('open-url', (_event, url) => {
	const magicInfo = handleOpenUrl(url);

	if (!magicInfo)
		return;

	const { code, state } = magicInfo;
	const windowId = createOnboardingWindow();
	const window = windowStack[windowId];

	window?.webContents.send('inbound-magic-link', { code, state });
});
