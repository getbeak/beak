import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as uuid from 'uuid';

import { staticPath } from './utils/static-path';

type Container = 'about' | 'welcome';

const DEV_URL = 'http://localhost:3000';
const environment = process.env.NODE_ENV;

export const windowStack: Record<string, BrowserWindow> = {};

function generateLoadUrl(container: Container) {
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

function createWindow(window: BrowserWindow, container: Container) {
	const windowId = uuid.v4();

	window.loadURL(generateLoadUrl(container));
	window.on('closed', () => {
		delete windowStack[windowId];
	});

	windowStack[windowId] = window;

}

export function createWelcomeWindow() {
	const window = new BrowserWindow({
		height: 550,
		width: 900,
		frame: false,
		resizable: false,
		title: 'Welcome to Beak!',
	});

	createWindow(window, 'welcome');
}

export function createAboutWindow() {
	const window = new BrowserWindow({
		height: 500,
		width: 450,
		titleBarStyle: 'hiddenInset',
		maximizable: false,
		resizable: false,
		title: 'About Beak',
	});

	createWindow(window, 'about');
}
