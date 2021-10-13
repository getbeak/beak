import { openProjectDialog } from '@beak/electron-host/lib/beak-project';
import { MenuItemConstructorOptions } from 'electron';

import { Context } from '.';
import { isProjectEditor, sendMenuItemClick } from './shared';

export default function generateFileMenu(ctx: Context): MenuItemConstructorOptions {
	return {
		label: 'File',
		submenu: [{
			label: 'New Request',
			accelerator: 'CmdOrCtrl+Shift+N',
			enabled: isProjectEditor(ctx),
			click: async () => sendMenuItemClick(ctx, 'new_request'),
		}, {
			label: 'New Folder',
			accelerator: 'CmdOrCtrl+Alt+N',
			enabled: isProjectEditor(ctx),
			click: async () => sendMenuItemClick(ctx, 'new_folder'),
		}, {
			type: 'separator',
		}, {
			label: 'Open Project',
			accelerator: 'CmdOrCtrl+O',
			click: async () => openProjectDialog(ctx.browserWindow),
		}, {
			label: 'Open Recent',
			// accelerator: 'CmdOrCtrl+Alt+O',
			role: 'recentDocuments',
			submenu: [{
				label: 'Clear Recent Projects',
				role: 'clearRecentDocuments',
			}],
		}, {
			type: 'separator',
		}, {
			role: ctx.isDarwin ? 'close' : 'quit',
		}],
	};
}
