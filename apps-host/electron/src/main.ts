import { init } from '@sentry/electron';
import { app, dialog } from 'electron';
import electronDebug from 'electron-debug';
import { autoUpdater } from 'electron-updater';

// EPIPE on stderr happens when the parent process (electron-esbuild dev's
// pipe, a launcher script, etc.) tears down while Node is still trying to
// emit a deprecation / process warning. The thrown EPIPE then walks up to
// `uncaughtException` and kills the app — which is silly, because the only
// thing we lost is a log line. Swallowing it here keeps the renderer alive
// when the dev harness gets impatient. Same guard for stdout for symmetry.
process.stderr.on('error', err => {
	if ((err as NodeJS.ErrnoException).code === 'EPIPE') return;
	throw err;
});
process.stdout.on('error', err => {
	if ((err as NodeJS.ErrnoException).code === 'EPIPE') return;
	throw err;
});

import './ipc-layer';
import getBeakHost from './host';
import { tryOpenProjectFolder } from './host/extensions/project';
import handleUrlEvent from './protocol';
import { attemptShowPostUpdateWelcome } from './updater';
import { createAndSetMenu } from './utils/menu';
import { appIsPackaged } from './utils/static-path';
import {
	attemptWindowPresenceLoad,
	createEmptyProjectMainWindow,
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

			if (url && (await handleUrlEvent(url))) return;
		}

		createOrFocusDefaultWindow();
	});
} else {
	app.quit();
}

// Quit application when all windows are closed on macOS
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
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

	if (appIsPackaged) return;

	const {
		default: installExtension,
		REDUX_DEVTOOLS,
		REACT_DEVELOPER_TOOLS,
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

	if (!handled) createOrFocusDefaultWindow();
});

app.on('browser-window-focus', (_event, window) => {
	// Set the correct menu for the browser window
	createAndSetMenu(window);
});

async function createOrFocusDefaultWindow(initial = false) {
	if (initial && (await attemptWindowPresenceLoad())) return void 0;

	const openWindow = Object.values(windowStack)[0];
	if (openWindow) {
		openWindow.focus();
		return void 0;
	}

	// No window-presence to restore. Boot order:
	//  1. Most-recent project from BeakRecents, so a returning user lands on
	//     their last work directly. Mirrors VS Code's `window.restoreWindows`
	//     default — fast path for returning users.
	//  2. Otherwise, open an empty workbench window with the welcome tab.
	//     No untitled project is materialised on disk; in-memory scratch
	//     projects are created on first edit (P3) and only persist if the
	//     user chooses Save Project As.
	if (initial) {
		const recents = await getBeakHost().project.recents.listProjects();
		const mostRecent = [...recents].sort((a, b) => b.accessTime.localeCompare(a.accessTime))[0];
		if (mostRecent) {
			const opened = await tryOpenProjectFolder(mostRecent.path, true);
			if (opened !== null) return void 0;
		}
	}

	try {
		await createEmptyProjectMainWindow();
	} catch (err) {
		console.warn('[main] failed to open empty workbench window', err);
		await dialog.showMessageBox({
			type: 'error',
			title: 'Could not start Beak',
			message: 'Beak could not open a window.',
			detail: err instanceof Error ? err.message : String(err),
		});
	}

	return void 0;
}
