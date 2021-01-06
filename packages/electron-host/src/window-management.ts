import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import * as path from 'path';
import * as url from 'url';

import { staticPath } from './utils/static-path';

type Container = 'about' | 'project-main' | 'welcome' | 'variable-group-editor' | 'onboarding';

export const windowStack: Record<number, BrowserWindow> = {};

const DEV_URL = 'http://localhost:3000';
const environment = process.env.NODE_ENV;
const stacks: Record<string, number> = { };

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

	return window.id;
}

export function closeWindow(windowId: number) {
	const window = windowStack[windowId];

	if (!window)
		return; // probs already closed...

	window.close();
	delete windowStack[windowId];
}

export function createWelcomeWindow() {
	const windowOpts: BrowserWindowConstructorOptions = {
		height: 550,
		width: 900,
		frame: false,
		resizable: false,
		title: 'Welcome to Beak!',
	};

	createWindow(windowOpts, 'welcome');
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

	// On Linux and Windows, we want total control of the frame
	if (process.platform !== 'darwin')
		windowOpts.frame = false;

	createWindow(windowOpts, 'project-main', { projectFilePath });
}

export function createVariableGroupEditorWindow(projectPath: string) {
	const key = `variable_group_editor:${projectPath}`;
	const existing = stacks[key];

	if (existing && windowStack[existing]) {
		windowStack[existing].focus();

		return;
	}

	const windowOpts: BrowserWindowConstructorOptions = {
		height: 600,
		width: 1000,
		title: 'Variable Group Editor',
	};

	// TODO(afr): Totally custom frame for Linux/Windows
	// // On Linux and Windows, we want total control of the frame
	// if (process.platform !== 'darwin')
	// 	windowOpts.frame = false;

	const windowId = createWindow(windowOpts, 'variable-group-editor', { projectPath });

	stacks[key] = windowId;
}

export function createOnboardingWindow() {
	const existing = stacks.onboarding;

	if (existing && windowStack[existing]) {
		windowStack[existing].focus();

		return existing;
	}

	const windowOpts: BrowserWindowConstructorOptions = {
		height: 310,
		width: 650,
		resizable: false,
		autoHideMenuBar: true,
		titleBarStyle: 'hiddenInset',
		title: 'Welcome to the Beak Alpha!',
	};

	const windowId = createWindow(windowOpts, 'onboarding');

	stacks.onboarding = windowId;

	return windowId;
}
