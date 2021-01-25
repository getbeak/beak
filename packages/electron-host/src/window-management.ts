import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import * as path from 'path';
import * as url from 'url';

import { staticPath } from './utils/static-path';

type Container = 'about' | 'project-main' | 'welcome' | 'onboarding';

export const windowStack: Record<number, BrowserWindow> = {};
export const stackMap: Record<string, number> = { };

const DEV_URL = 'http://localhost:3000';
const environment = process.env.NODE_ENV;

function generateLoadUrl(
	container: Container,
	windowId: number,
	additionalParams?: Record<string, string>,
) {
	let loadUrl = new URL(url.format({
		pathname: path.join(staticPath, 'index.html'),
		protocol: 'file:',
		slashes: true,
	}));

	if (environment !== 'production')
		loadUrl = new URL(DEV_URL);

	if (additionalParams) {
		Object.keys(additionalParams).forEach(k => {
			if (k === 'container')
				return; // Just to be extra safe

			const urlSafe = encodeURIComponent(additionalParams[k]);

			loadUrl.searchParams.set(k, urlSafe);
		});
	}

	loadUrl.searchParams.set('container', container);
	loadUrl.searchParams.set('windowId', String(windowId));

	return loadUrl.toString();
}

function createWindow(
	windowOpts: BrowserWindowConstructorOptions,
	container: Container,
	additionalParams?: Record<string, string>,
) {
	const window = new BrowserWindow({
		webPreferences: {
			enableRemoteModule: true,
			nodeIntegration: true,
		},
		...windowOpts,
	});

	window.loadURL(generateLoadUrl(container, window.id, additionalParams));
	window.on('close', () => {
		delete windowStack[window.id];
	});

	windowStack[window.id] = window;

	return window;
}

export function closeWindow(windowId: number) {
	const window = windowStack[windowId];

	if (!window)
		return; // probs already closed...

	window.close();
	delete windowStack[windowId];
}

export function createWelcomeWindow() {
	const existingWindow = stackMap['welcome'];

	if (existingWindow && windowStack[existingWindow]) {
		windowStack[existingWindow].focus();

		return;
	}

	const windowOpts: BrowserWindowConstructorOptions = {
		height: 550,
		width: 900,
		frame: false,
		resizable: false,
		title: 'Welcome to Beak!',
	};

	const window = createWindow(windowOpts, 'welcome');

	stackMap['welcome'] = window.id;
}

export function createAboutWindow() {
	const windowOpts: BrowserWindowConstructorOptions = {
		height: 500,
		width: 450,
		titleBarStyle: 'hiddenInset',
		maximizable: false,
		resizable: false,
		title: 'About Beak',
	};

	createWindow(windowOpts, 'about');
}

export function createProjectMainWindow(projectFilePath: string) {
	const windowOpts: BrowserWindowConstructorOptions = {
		height: 850,
		width: 1400,
		minHeight: 435,
		minWidth: 760,
		title: 'Loading... - Beak',
		titleBarStyle: 'hiddenInset',
	};

	// Hopefully vibrancy comes to windows soon
	if (process.platform === 'darwin')
		windowOpts.vibrancy = 'dark'; // TODO(afr): Change this to `under-window` or `sidebar` soon.

	// On Linux and Windows we want total control of the frame
	if (process.platform !== 'darwin')
		windowOpts.frame = false;

	const window = createWindow(windowOpts, 'project-main', { projectFilePath });

	window.setRepresentedFilename(projectFilePath);
}

export function createOnboardingWindow() {
	const existing = stackMap.onboarding;

	if (existing && windowStack[existing]) {
		windowStack[existing].focus();

		return existing;
	}

	const windowOpts: BrowserWindowConstructorOptions = {
		height: 350,
		width: 650,
		resizable: false,
		autoHideMenuBar: true,
		titleBarStyle: 'hiddenInset',
		title: 'Welcome to the Beak Alpha!',
	};

	const window = createWindow(windowOpts, 'onboarding');

	stackMap.onboarding = window.id;

	return window.id;
}
