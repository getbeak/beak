import { openProjectDialog } from '@beak/apps-host-electron/host/extensions/project';
import { createPreferencesWindow, createWelcomeWindow } from '@beak/apps-host-electron/window-management';
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
			label: 'New Window...',
			click: async () => createWelcomeWindow(),
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
			label: 'View project encryption',
			enabled: isProjectEditor(ctx),
			click: async () => sendMenuItemClick(ctx, 'view_project_encryption'),
		}, {
			type: 'separator',
			visible: !ctx.isDarwin,
		}, {
			label: 'Preferences...',
			visible: !ctx.isDarwin,
			click: async () => await createPreferencesWindow(),
		}, {
			role: ctx.isDarwin ? 'close' : 'quit',
		}],
	};
}
