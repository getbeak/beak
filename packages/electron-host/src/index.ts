/* eslint-disable global-require */
import './ipc-layer';
import './updater';

import { init } from '@sentry/electron/dist/main';
import { app, nativeTheme } from 'electron';
import electronDebug from 'electron-debug';
import { autoUpdater } from 'electron-updater';

import arbiter from './lib/arbiter';
import nestClient from './lib/nest-client';
import persistentStore from './lib/persistent-store';
import { parseAppUrl } from './lib/protocol';
import createMenu from './menu';
import { appIsPackaged } from './utils/static-path';
import {
	createOnboardingWindow,
	createWelcomeWindow,
	windowStack,
} from './window-management';

init({
	dsn: 'https://5118444e09d74b03a320d0e604aa68ff@o988021.ingest.sentry.io/5945114',
	appName: 'Main process',
	environment: process.env.ENVIRONMENT,
	release: process.env.RELEASE_IDENTIFIER,
});

createMenu();
app.setAsDefaultProtocolClient('beak-app');

const instanceLock = app.requestSingleInstanceLock();

if (instanceLock) {
	app.on('second-instance', (_event, argv) => {
		if (process.platform !== 'darwin') {
			const url = argv.find(a => a.startsWith('beak-app://'));

			if (url && handleOpenUrl(url))
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

app.on('ready', () => {
	nativeTheme.themeSource = 'dark';

	arbiter.start();
	autoUpdater.checkForUpdatesAndNotify();
	createOrFocusDefaultWindow();

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

app.on('open-url', (_event, url) => {
	if (!handleOpenUrl(url))
		createOrFocusDefaultWindow();
});

async function createOrFocusDefaultWindow() {
	if (!persistentStore.get('passedOnboarding'))
		return createOnboardingWindow();

	const auth = await nestClient.getAuth();

	if (!auth)
		return createOnboardingWindow();

	const openWindow = Object.values(windowStack)[0];

	if (openWindow) {
		openWindow.focus();

		return openWindow.id;
	}

	return createWelcomeWindow();
}

function handleOpenUrl(url: string) {
	const magicInfo = parseAppUrl(url);

	if (!magicInfo)
		return false;

	const { code, state } = magicInfo;
	const windowId = createOnboardingWindow();
	const window = windowStack[windowId];

	window?.webContents.send('inbound_magic_link', { code, state });

	return true;
}
