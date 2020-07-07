import { app, BrowserWindow } from 'electron';
import * as path from 'path';

import { staticPath } from './utils/static-path';

const DEV_URL = 'http://localhost:3000';
const environment = process.env.NODE_ENV;

let mainWindow: BrowserWindow | undefined;

function createWelcomeWindow() {
	mainWindow = new BrowserWindow({
		height: 450,
		width: 700,
		frame: false,
	});

	mainWindow.loadURL(generateLoadUrl('welcome'));

	mainWindow.on('closed', () => {
		mainWindow = void 0;
	});
};

// Quit application when all windows are closed
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
});

app.on('activate', () => {
	if (!mainWindow)
		createWelcomeWindow();
});

app.on('ready', () => {
	createWelcomeWindow();
});

function generateLoadUrl(container: 'welcome') {
	let loadUrl = new URL(`file:///${path.join(staticPath, 'dist', 'index.html')}`);

	if (environment !== 'production')
		loadUrl = new URL(DEV_URL);

	loadUrl.searchParams.set('container', container);

	return loadUrl.toString();
}
