/* eslint-disable global-require, no-process-env */
import { init } from '@sentry/electron';
import { app } from 'electron';
import electronDebug from 'electron-debug';
import { autoUpdater } from 'electron-updater';

import './ipc-layer';
import arbiter from './lib/arbiter';
import { attemptMarketingConsentScreen } from './lib/marketing-consent';
import nestClient from './lib/nest-client';
import persistentStore from './lib/persistent-store';
import { tryOpenProjectFolder } from './lib/project';
import handleUrlEvent from './protocol';
import { attemptShowPostUpdateWelcome } from './updater';
import { createAndSetMenu } from './utils/menu';
import { appIsPackaged } from './utils/static-path';
import {
	attemptWindowPresenceLoad,
	createPortalWindow,
	createWelcomeWindow,
	generateWindowPresence,
	windowStack,
} from './window-management';

if (process.env.NODE_ENV !== 'development') {
	init({
		dsn: 'https://5118444e09d74b03a320d0e604aa68ff@o988021.ingest.sentry.io/5945114',
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

app.on('before-quit', () => {
	// Store window presence for next load
	persistentStore.set('previousWindowPresence', generateWindowPresence());
});

app.on('ready', () => {
	createAndSetMenu();
	arbiter.start();
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

	electronDebug();
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
	if (!persistentStore.get('passedOnboarding'))
		return void createPortalWindow();

	const auth = await nestClient.getAuth();

	if (!auth)
		return void createPortalWindow();

	attemptMarketingConsentScreen();

	if (initial && await attemptWindowPresenceLoad())
		return void 0;

	const openWindow = Object.values(windowStack)[0];

	if (openWindow)
		openWindow.focus();
	else
		createWelcomeWindow();

	return void 0;
}
