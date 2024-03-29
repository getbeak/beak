/* eslint-disable global-require, no-process-env */
import { init } from '@sentry/electron';
import { app } from 'electron';
import electronDebug from 'electron-debug';
import { autoUpdater } from 'electron-updater';

import './ipc-layer';
import getBeakHost from './host';
import { tryOpenProjectFolder } from './host/extensions/project';
import handleUrlEvent from './protocol';
import { attemptShowPostUpdateWelcome } from './updater';
import { createAndSetMenu } from './utils/menu';
import { appIsPackaged } from './utils/static-path';
import {
	attemptWindowPresenceLoad,
	createWelcomeWindow,
	generateWindowPresence,
	windowStack,
} from './window-management';

if (process.env.NODE_ENV !== 'development') {
	init({
		dsn: 'https://c7a8bd8013242cfe728beeaae8a3e9f1@o988021.ingest.sentry.io/4506451600670720',
		environment: process.env.ENVIRONMENT,
		release: process.env.RELEASE_IDENTIFIER,
	});
}

app.setAsDefaultProtocolClient('beak-app');

export const screenshotSizing = Boolean(process.env.SCREENSHOT_SIZING);
const instanceLock = app.requestSingleInstanceLock();

if (instanceLock) {
	app.on('second-instance', async (_event, argv) => {
		if (process.platform !== 'darwin') {
			const url = argv.find(a => a.startsWith('beak-app://'));

			if (url && await handleUrlEvent(url))
				return;
		}

		createOrFocusDefaultWindow();
	});
} else {
	app.quit();
}

// Quit application when all windows are closed on macOS
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
});

app.on('activate', () => {
	createOrFocusDefaultWindow();
});

app.on('before-quit', async () => {
	// Store window presence for next load
	await getBeakHost().providers.storage.set('previousWindowPresence', generateWindowPresence());
});

app.on('ready', () => {
	createAndSetMenu();
	autoUpdater.checkForUpdates();
	createOrFocusDefaultWindow(true);
	attemptShowPostUpdateWelcome();

	if (appIsPackaged)
		return;

	const {
		default: installExtension,
		REDUX_DEVTOOLS,
		REACT_DEVELOPER_TOOLS,
		// eslint-disable-next-line @typescript-eslint/no-var-requires
	} = require('electron-devtools-installer');

	electronDebug({ showDevTools: false });
	installExtension(REDUX_DEVTOOLS);
	installExtension(REACT_DEVELOPER_TOOLS);
});

app.on('open-file', async (_event, filePath) => {
	await tryOpenProjectFolder(filePath);
});

app.on('open-url', async (_event, url) => {
	const handled = await handleUrlEvent(url);

	if (!handled)
		createOrFocusDefaultWindow();
});

app.on('browser-window-focus', (_event, window) => {
	// Set the correct menu for the browser window
	createAndSetMenu(window);
});

async function createOrFocusDefaultWindow(initial = false) {
	if (initial && await attemptWindowPresenceLoad())
		return void 0;

	const openWindow = Object.values(windowStack)[0];

	if (openWindow)
		openWindow.focus();
	else
		await createWelcomeWindow();

	return void 0;
}
