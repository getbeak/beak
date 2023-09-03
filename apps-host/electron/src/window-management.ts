import { WindowPresence } from '@beak/common-host/providers/storage';
import { app, BrowserWindow, BrowserWindowConstructorOptions, nativeTheme } from 'electron';
import * as path from 'path';
import * as url from 'url';

import getBeakHost from './host';
import { tryOpenProjectFolder } from './host/extensions/project';
import { getProjectFromWindowId } from './ipc-layer/fs-shared';
import { closeWatchersOnWindow } from './ipc-layer/fs-watcher-service';
import WindowStateManager from './lib/window-state-manager';
import { screenshotSizing } from './main';
import { staticPath } from './utils/static-path';

export type Container = 'project-main' | 'welcome' | 'preferences' | 'portal';

// This is pretty lame, there should be a better way
export const projectIdToWindowIdMapping: Record<string, number> = {};
export const windowIdToProjectIdMapping: Record<number, string> = {};

export const windowStack: Record<number, BrowserWindow> = {};
export const windowType: Record<number, Container> = {};
export const stackMap: Record<string, number> = {};

const DEV_URL = 'http://localhost:5173';
// eslint-disable-next-line no-process-env
const environment = process.env.NODE_ENV;

export function generateWindowPresence() {
	const windows = BrowserWindow.getAllWindows().filter(w => windowType[w.id]);
	const windowPresence = windows.reduce<(WindowPresence | null)[]>((acc, val) => {
		const type = windowType[val.id];

		// Don't persist portal, as it's only used for signed out state
		if (!type || type === 'portal')
			return [...acc, null];

		if (type === 'project-main') {
			const projectFilePath = getProjectFromWindowId(val.id);
			const projectPath = path.dirname(projectFilePath);

			if (!projectPath)
				return [...acc, null];

			return [...acc, { type: 'project-main', payload: projectPath }];
		}

		return [...acc, { type: 'generic', payload: type }];
	}, []);

	return windowPresence.filter(Boolean) as WindowPresence[];
}

export async function attemptWindowPresenceLoad() {
	if (screenshotSizing)
		return false;

	const previousWindowPresence = await getBeakHost().providers.storage.get('previousWindowPresence');

	if (previousWindowPresence.length === 0)
		return false;

	let success = false;

	await Promise.all(previousWindowPresence.map(async p => {
		if (p.type === 'project-main') {
			const response = await tryOpenProjectFolder(p.payload, true);

			if (response !== null)
				success = true;

			return;
		}

		switch (p.payload) {
			case 'portal':
				await createPortalWindow();

				success = true;
				break;

			case 'preferences':
				await createPreferencesWindow();

				success = true;
				break;

			case 'welcome':
				await createWelcomeWindow();

				success = true;
				break;

			default:
				return;
		}
	}));

	return success;
}

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
	loadUrl.searchParams.set('version', app.getVersion());
	loadUrl.searchParams.set('platform', process.platform);
	loadUrl.searchParams.set('windowId', String(windowId));

	return loadUrl.toString();
}

async function createWindow(
	windowOpts: BrowserWindowConstructorOptions,
	container: Container,
	additionalParams?: Record<string, string>,
) {
	nativeTheme.themeSource = await getBeakHost().providers.storage.get('themeMode');

	if (screenshotSizing && container === 'project-main') {
		/* eslint-disable no-param-reassign */
		windowOpts.minWidth = 1300;
		windowOpts.maxWidth = 1300;
		windowOpts.minHeight = 800;
		windowOpts.maxHeight = 800;
		/* eslint-enable no-param-reassign */
	}

	const windowStateManager = await WindowStateManager.create(container, windowOpts);
	const window = new BrowserWindow({
		webPreferences: {
			contextIsolation: true,
			preload: path.join(app.getAppPath(), 'preload.js'),
		},
		show: false,
		hasShadow: true,
		...windowOpts,
	});

	if (!screenshotSizing) windowStateManager.attach(window);

	window.loadURL(generateLoadUrl(container, window.id, additionalParams));
	window.on('ready-to-show', () => {
		window.show();
		window.focus();
	});
	window.on('close', () => {
		delete windowStack[window.id];
	});

	window.webContents.on('did-start-loading', () => {
		// When a window loads, make sure any watchers from the previous session are closed
		// This only really affects things like FS watchers, which can persist after a reload
		closeWatchersOnWindow(window.webContents.id);
	});

	windowStack[window.id] = window;
	windowType[window.id] = container;

	return window;
}

export function tryCloseWelcomeWindow() {
	const windowId = stackMap.welcome;

	if (windowId === void 0)
		return;

	const window = windowStack[windowId];

	if (!window)
		return;

	window.close();

	delete windowStack[windowId];
	delete stackMap.welcome;
}

export function closeWindow(windowId: number) {
	const window = BrowserWindow.getAllWindows().find(win => win.webContents.id === windowId);

	if (!window)
		return; // probs already closed...

	window.close();
	delete windowStack[windowId];
}

export function reloadWindow(windowId: number) {
	const window = BrowserWindow.getAllWindows().find(win => win.webContents.id === windowId);

	if (!window)
		return; // probs already closed...

	window.reload();
}

export async function createWelcomeWindow() {
	const existing = stackMap.welcome;

	if (existing && windowStack[existing]) {
		if (windowStack[existing].isMinimized())
			windowStack[existing].restore();

		windowStack[existing].focus();

		return existing;
	}

	const windowOpts: BrowserWindowConstructorOptions = {
		height: 500,
		width: 900,
		resizable: false,
		title: 'Welcome to Beak!',
		autoHideMenuBar: true,
		transparent: true,
		visualEffectState: 'active',
		vibrancy: 'under-window',
	};

	if (process.platform === 'darwin')
		windowOpts.frame = false;

	if (process.platform === 'darwin')
		windowOpts.frame = false;
	if (process.platform !== 'darwin')
		windowOpts.height = 550;

	const window = await createWindow(windowOpts, 'welcome');

	stackMap.welcome = window.id;

	return window.id;
}

export async function createPreferencesWindow() {
	const existing = stackMap.preferences;

	if (existing && windowStack[existing]) {
		if (windowStack[existing].isMinimized())
			windowStack[existing].restore();

		windowStack[existing].focus();

		return existing;
	}

	const windowOpts: BrowserWindowConstructorOptions = {
		height: 550,
		width: 900,
		resizable: false,
		title: 'Beak preferences',
		autoHideMenuBar: true,
		transparent: true,
		titleBarStyle: 'hiddenInset',
		visualEffectState: 'active',
		vibrancy: 'under-window',
	};

	if (process.platform === 'darwin')
		windowOpts.frame = false;

	const window = await createWindow(windowOpts, 'preferences');

	stackMap.preferences = window.id;

	return window.id;
}

export async function createProjectMainWindow(projectId: string, projectFilePath: string) {
	const windowOpts: BrowserWindowConstructorOptions = {
		height: 850,
		width: 1400,
		minHeight: 450,
		minWidth: 1150,
		title: 'Loading... - Beak',
		titleBarStyle: 'hiddenInset',
		visualEffectState: 'active',
	};

	// Hopefully vibrancy comes to windows soon
	if (process.platform === 'darwin') {
		windowOpts.frame = false;
		windowOpts.transparent = true;
		windowOpts.vibrancy = 'under-window';
	}

	// On Windows we want total control of the frame
	if (process.platform !== 'darwin')
		windowOpts.autoHideMenuBar = false;

	const window = await createWindow(windowOpts, 'project-main');

	projectIdToWindowIdMapping[projectId] = window.id;
	windowIdToProjectIdMapping[window.id] = projectId;

	window.setRepresentedFilename(projectFilePath);

	return window.id;
}

export async function createPortalWindow() {
	const existing = stackMap.portal;

	if (existing && windowStack[existing]) {
		if (windowStack[existing].isMinimized())
			windowStack[existing].restore();

		windowStack[existing].focus();

		return existing;
	}

	const windowOpts: BrowserWindowConstructorOptions = {
		height: 400,
		width: 800,
		resizable: false,
		title: 'Welcome to Beak',
		autoHideMenuBar: true,
		transparent: true,
		titleBarStyle: 'hiddenInset',
		visualEffectState: 'active',
		vibrancy: 'under-window',
	};

	if (process.platform === 'darwin')
		windowOpts.frame = false;

	const window = await createWindow(windowOpts, 'portal');

	stackMap.portal = window.id;

	return window.id;
}
