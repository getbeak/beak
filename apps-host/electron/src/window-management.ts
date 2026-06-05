import * as path from 'node:path';
import * as url from 'node:url';
import type { WindowPresence } from '@beak/runtime-shared/providers/storage';
import { app, BrowserWindow, type BrowserWindowConstructorOptions, dialog, nativeTheme } from 'electron';

import getBeakHost from './host';
import { tryOpenProjectFolder } from './host/project';
import { getProjectFilePathFromWindowId } from './ipc-layer/fs-shared';
import { closeWatchersOnWindow } from './ipc-layer/fs-watcher-service';
import WindowStateManager from './lib/window-state-manager';
import { screenshotSizing } from './main';
import { staticPath } from './utils/static-path';

export type Container = 'project-main' | 'preferences';

// This is pretty lame, there should be a better way
export const projectIdToWindowIdMapping: Record<string, number> = {};
export const windowIdToProjectIdMapping: Record<number, string> = {};
export const windowIdToProjectFilePathMapping: Record<number, string> = {};

export const windowStack: Record<number, BrowserWindow> = {};
export const windowType: Record<number, Container> = {};
export const stackMap: Record<string, number> = {};

/**
 * Window IDs whose renderer reports unsaved in-memory changes. Updated by
 * the renderer via `ipcWindowService.setDirty` whenever the project mode
 * + tree size combination crosses the dirty boundary. Drives the
 * unsaved-changes confirmation on window close.
 */
const dirtyWindowIds = new Set<number>();

/** True if the close path is currently dispatching the unsaved-changes
 *  dialog for a given window — used to ensure the renderer's in-flight
 *  Save Project As doesn't race the dialog and double-prompt.
 */
const closeInFlight = new Set<number>();

export function setWindowDirty(windowId: number, dirty: boolean) {
	if (dirty) dirtyWindowIds.add(windowId);
	else dirtyWindowIds.delete(windowId);
}

async function promptUnsavedClose(window: BrowserWindow) {
	const result = await dialog.showMessageBox(window, {
		type: 'warning',
		title: 'Save changes to this project?',
		message: 'Your changes will be lost if you don’t save them.',
		buttons: ['Save…', "Don't save", 'Cancel'],
		defaultId: 0,
		cancelId: 2,
	});

	switch (result.response) {
		case 2:
			// Cancel — keep the window open. closeInFlight clears via finally.
			return;
		case 1:
			// Don't save — drop dirty + force-close, bypassing the close guard.
			dirtyWindowIds.delete(window.id);
			window.destroy();
			delete windowStack[window.id];
			return;
		case 0:
		default: {
			// Save — ask the renderer to run materialiseFromMemory. The
			// successful save closes + reopens this window itself; if the
			// user cancels the folder picker, the window stays open and
			// stays dirty, ready for them to try again.
			window.webContents.send('window:request_save');
			return;
		}
	}
}

// Electron's renderer dev server lives on 5174; 5173 is the web host
// (apps-host/web) which uses HTTPS + service workers and would refuse
// our embedded BrowserWindow's plain-frame load.
const DEV_URL = 'http://localhost:5174';
const environment = process.env.NODE_ENV;

export function generateWindowPresence() {
	const windows = BrowserWindow.getAllWindows().filter(w => windowType[w.id]);
	const windowPresence = windows.reduce<(WindowPresence | null)[]>((acc, val) => {
		const type = windowType[val.id];

		if (!type) return [...acc, null];

		if (type === 'project-main') {
			const projectFilePath = getProjectFilePathFromWindowId(val.id);

			// No projectFilePath = empty workbench window. Persist as a generic
			// 'empty' payload so cold restore opens the welcome workbench again
			// instead of falling through to the most-recent project.
			if (!projectFilePath) return [...acc, { type: 'generic', payload: 'empty' }];

			const projectPath = path.dirname(projectFilePath);
			if (!projectPath) return [...acc, null];

			return [...acc, { type: 'project-main', payload: projectPath }];
		}

		return [...acc, { type: 'generic', payload: type }];
	}, []);

	return windowPresence.filter(Boolean) as WindowPresence[];
}

export async function attemptWindowPresenceLoad() {
	if (screenshotSizing) return false;

	const previousWindowPresence = await getBeakHost().providers.storage.get('previousWindowPresence');

	if (previousWindowPresence.length === 0) return false;

	let success = false;

	await Promise.all(
		previousWindowPresence.map(async p => {
			if (p.type === 'project-main') {
				const response = await tryOpenProjectFolder(p.payload, true);

				if (response !== null) success = true;

				return;
			}

			switch (p.payload) {
				case 'preferences':
					await createPreferencesWindow();

					success = true;
					break;

				case 'empty':
					await createEmptyProjectMainWindow();

					success = true;
					break;

				default:
					// 'welcome' / unknown payloads — no-op. Cold boot will fall
					// back to opening the most-recent project or an empty
					// workbench window.
					return;
			}
		}),
	);

	return success;
}

function generateLoadUrl(container: Container, windowId: number, additionalParams?: Record<string, string>) {
	let loadUrl = new URL(
		url.format({
			pathname: path.join(staticPath, 'index.html'),
			protocol: 'file:',
			slashes: true,
		}),
	);

	if (environment !== 'production') loadUrl = new URL(DEV_URL);

	if (additionalParams) {
		Object.keys(additionalParams).forEach(k => {
			if (k === 'container') return; // Just to be extra safe

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
	windowOpts: BrowserWindowConstructorOptions & { width: number; height: number },
	container: Container,
	additionalParams?: Record<string, string>,
) {
	nativeTheme.themeSource = await getBeakHost().providers.storage.get('themeMode');

	if (screenshotSizing && container === 'project-main') {
		windowOpts.minWidth = 1300;
		windowOpts.maxWidth = 1300;
		windowOpts.minHeight = 800;
		windowOpts.maxHeight = 800;
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
	window.on('close', event => {
		// Unsaved-changes guard. Only project-main windows can be dirty
		// (memory-mode projects with non-empty trees); the renderer keeps
		// dirtyWindowIds in sync via ipcWindowService.setDirty.
		if (dirtyWindowIds.has(window.id) && !closeInFlight.has(window.id)) {
			event.preventDefault();
			closeInFlight.add(window.id);
			void promptUnsavedClose(window).finally(() => closeInFlight.delete(window.id));
			return;
		}

		dirtyWindowIds.delete(window.id);
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

/**
 * Welcome screens were removed in May 2026 — Beak now boots straight into
 * a project window (most-recent or untitled). This stub is kept temporarily
 * so call sites that used to close the welcome window during project-open
 * flows are no-ops instead of throwing during the migration.
 */
export function tryCloseWelcomeWindow() {
	// Intentionally empty — see comment above.
}

export function closeWindow(windowId: number) {
	const window = BrowserWindow.getAllWindows().find(win => win.webContents.id === windowId);

	if (!window) return; // probs already closed...

	window.close();
	delete windowStack[windowId];
}

export function reloadWindow(windowId: number) {
	const window = BrowserWindow.getAllWindows().find(win => win.webContents.id === windowId);

	if (!window) return; // probs already closed...

	window.reload();
}

export async function createPreferencesWindow() {
	const existing = stackMap.preferences;

	if (existing && windowStack[existing]) {
		if (windowStack[existing].isMinimized()) windowStack[existing].restore();

		windowStack[existing].focus();

		return existing;
	}

	const windowOpts: BrowserWindowConstructorOptions & { width: number; height: number } = {
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

	if (process.platform === 'darwin') windowOpts.frame = false;

	const window = await createWindow(windowOpts, 'preferences');

	stackMap.preferences = window.id;

	return window.id;
}

function projectMainWindowOpts(): BrowserWindowConstructorOptions & { width: number; height: number } {
	const windowOpts: BrowserWindowConstructorOptions & { width: number; height: number } = {
		height: 850,
		width: 1400,
		minHeight: 450,
		minWidth: 1150,
		resizable: true,
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
	if (process.platform !== 'darwin') windowOpts.autoHideMenuBar = false;

	return windowOpts;
}

export async function createProjectMainWindow(projectId: string, projectFilePath: string) {
	const window = await createWindow(projectMainWindowOpts(), 'project-main');

	projectIdToWindowIdMapping[projectId] = window.id;
	windowIdToProjectIdMapping[window.id] = projectId;
	windowIdToProjectFilePathMapping[window.id] = projectFilePath;

	window.setRepresentedFilename(projectFilePath);

	return window.id;
}

/**
 * Empty workbench window — same chrome as a project-main window but with no
 * project bound to it. The renderer reads `?empty=1` and skips the project
 * load entirely, opening the welcome tab. Used as the cold-start landing
 * when there are no recents to restore.
 */
export async function createEmptyProjectMainWindow() {
	const window = await createWindow(projectMainWindowOpts(), 'project-main', { empty: '1' });
	window.setTitle('Beak');
	return window.id;
}
