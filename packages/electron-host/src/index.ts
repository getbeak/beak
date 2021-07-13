/* eslint-disable global-require */
import './ipc-layer';
import './updater';

import { app, nativeTheme } from 'electron';
import electronDebug from 'electron-debug';
import { autoUpdater } from 'electron-updater';

import arbiter from './lib/arbiter';
import persistentStore from './lib/persistent-store';
import { parseAppUrl } from './lib/protocol';
import createMenu from './menu';
import { appIsPackaged } from './utils/static-path';
import {
	createOnboardingWindow,
	createWelcomeWindow,
	windowStack,
} from './window-management';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('@electron/remote/main').initialize();

createMenu();
app.setAsDefaultProtocolClient('beak-app');

const instanceLock = app.requestSingleInstanceLock();

if (instanceLock) {
	app.on('second-instance', (_event, argv, _wd) => {
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
	const auth = persistentStore.get('auth');

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
