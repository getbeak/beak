import { openProjectDialog } from '@beak/apps-host-electron/host/project';
import { createEmptyProjectMainWindow, createPreferencesWindow } from '@beak/apps-host-electron/window-management';
import type { MenuItemConstructorOptions } from 'electron';

import type { Context } from '.';
import { isProjectEditor, sendMenuItemClick } from './shared';

export default function generateFileMenu(ctx: Context): MenuItemConstructorOptions {
	return {
		label: 'File',
		submenu: [
			{
				label: 'New Request',
				accelerator: 'CmdOrCtrl+Shift+N',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'new_request'),
			},
			{
				label: 'New Folder',
				accelerator: 'CmdOrCtrl+Alt+N',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'new_folder'),
			},
			{
				label: 'New Window',
				accelerator: 'CmdOrCtrl+Shift+M',
				click: async () => createEmptyProjectMainWindow(),
			},
			{
				type: 'separator',
			},
			{
				label: 'Open Project',
				accelerator: 'CmdOrCtrl+O',
				click: async () => openProjectDialog(ctx.browserWindow),
			},
			{
				label: 'Open Recent',
				role: 'recentDocuments',
				submenu: [
					{
						label: 'Clear Recent Projects',
						role: 'clearRecentDocuments',
					},
				],
			},
			{
				label: 'Save Project As…',
				accelerator: 'CmdOrCtrl+Shift+S',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'save_project_as'),
			},
			{
				type: 'separator',
			},
			{
				label: 'Project Home',
				accelerator: 'CmdOrCtrl+Shift+H',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'show_project_home'),
			},
			{
				label: 'Import OpenAPI spec…',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'import_openapi_spec'),
			},
			{
				label: 'Export OpenAPI spec…',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'export_openapi_spec'),
			},
			{
				type: 'separator',
			},
			{
				label: 'View project encryption',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'view_project_encryption'),
			},
			{
				type: 'separator',
				visible: !ctx.isDarwin,
			},
			{
				label: 'Preferences...',
				visible: !ctx.isDarwin,
				click: async () => {
					if (isProjectEditor(ctx)) sendMenuItemClick(ctx, 'show_preferences');
					else await createPreferencesWindow();
				},
			},
			{
				role: ctx.isDarwin ? 'close' : 'quit',
			},
		],
	};
}
