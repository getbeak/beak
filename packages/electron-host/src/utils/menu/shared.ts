import { MenuEventCode } from '@beak/common/web-contents/types';
import { MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';

import { Context } from '.';

export function createUpdateMenuItem(): MenuItemConstructorOptions {
	return {
		label: 'Check for Updates',
		click: () => autoUpdater.checkForUpdatesAndNotify(),
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
