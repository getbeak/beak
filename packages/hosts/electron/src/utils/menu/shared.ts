import { MenuEventCode } from '@beak/shared-common/web-contents/types';
import { getPendingUpdate } from '@beak/host-electron/updater';
import { MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';

import { Context } from '.';

export function createUpdateMenuItem(): MenuItemConstructorOptions {
	const pendingUpdate = getPendingUpdate();

	if (pendingUpdate) {
		return {
			label: 'Install update...',
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
