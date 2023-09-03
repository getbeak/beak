import { getCheckingForUpdates, getPendingUpdate, getUpdateDownloading } from '@beak/apps-host-electron/updater';
import { MenuEventCode } from '@beak/common/web-contents/types';
import { MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';

import { Context } from '.';

export function createUpdateMenuItem(): MenuItemConstructorOptions {
	const checkingForUpdates = getCheckingForUpdates();
	const updateDownloading = getUpdateDownloading();
	const pendingUpdate = getPendingUpdate();

	if (checkingForUpdates) {
		return {
			label: 'Checking for Updates...',
			enabled: false,
		};
	}

	if (updateDownloading) {
		return {
			label: 'Update Downloading...',
			enabled: false,
		};
	}

	if (pendingUpdate) {
		return {
			label: 'Update Available...',
			click: () => autoUpdater.quitAndInstall(),
		};
	}

	return {
		label: 'Check for Updates',
		click: () => autoUpdater.checkForUpdates(),
	};
}

export function isProjectEditor(ctx: Context) {
	return ctx.container === 'project-main';
}

export function sendMenuItemClick(ctx: Context, code: MenuEventCode) {
	if (!ctx.browserWindow)
		return;

	ctx.browserWindow.webContents.send('menu:menu_item_click', { code });
}
