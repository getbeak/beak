import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as uuid from 'uuid';

import { staticPath } from './utils/static-path';

const DEV_URL = 'http://localhost:3000';
const environment = process.env.NODE_ENV;

const windows: Record<string, BrowserWindow> = {};

function createWelcomeWindow() {
	const windowId = uuid.v4();
	const win = new BrowserWindow({
		height: 550,
		width: 900,
		resizable: false,
		frame: false,
	});

	windows[windowId] = win;

	win.loadURL(generateLoadUrl('welcome'));
	win.webContents.openDevTools();

	win.on('closed', () => {
		delete windows[windowId];
	});

}

// Quit application when all windows are closed
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
});

app.on('activate', () => {
	if (Object.keys(windows).length === 0)
		createWelcomeWindow();
});

app.on('ready', () => {
	createWelcomeWindow();
});

function generateLoadUrl(container: 'welcome') {
	let loadUrl = new URL(url.format({
		pathname: path.join(staticPath, 'dist', 'index.html'),
		protocol: 'file:',
		slashes: true,
	}));

	if (environment !== 'production')
		loadUrl = new URL(DEV_URL);

	loadUrl.searchParams.set('container', container);

	return loadUrl.toString();
}
