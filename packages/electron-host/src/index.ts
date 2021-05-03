/* eslint-disable global-require */
import './ipc-layer';

import { app } from 'electron';
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

createMenu();
app.setAsDefaultProtocolClient('beak-app');

const instanceLock = app.requestSingleInstanceLock();

if (instanceLock) {
	app.on('second-instance', (_event, argv, _wd) => {
		if (process.platform !== 'darwin') {
			const url = argv.find(a => a.startsWith('beak-app://'));

			if (url) {
				handleOpenUrl(url);

				return;
			}
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
	arbiter.start();
	createOrFocusDefaultWindow();

	autoUpdater.checkForUpdatesAndNotify();

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
	handleOpenUrl(url);
});

async function createOrFocusDefaultWindow() {
	const auth = persistentStore.get('auth');

	if (!auth)
		return createOnboardingWindow();

	return createWelcomeWindow();
}

function handleOpenUrl(url: string) {
	const magicInfo = parseAppUrl(url);

	if (!magicInfo)
		return;

	const { code, state } = magicInfo;
	const windowId = createOnboardingWindow();
	const window = windowStack[windowId];

	window?.webContents.send('inbound-magic-link', { code, state });
}
