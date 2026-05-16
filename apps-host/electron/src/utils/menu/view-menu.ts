import type { MenuItemConstructorOptions } from 'electron';

import type { Context } from '.';
import { isProjectEditor, sendMenuItemClick } from './shared';

export default function generateViewMenu(ctx: Context): MenuItemConstructorOptions {
	return {
		label: 'View',
		submenu: [
			{ type: 'separator' },
			{
				label: 'Close Tab',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'close_tab'),
			},
			{
				label: 'Close All Tabs',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'close_all_tabs'),
			},
			{
				label: 'Close Other Tabs',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'close_other_tabs'),
			},
			{
				label: 'Select Next Tab',
				accelerator: 'Ctrl+Tab',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'select_next_tab'),
			},
			{
				label: 'Select Previous Tab',
				accelerator: 'Ctrl+Shift+Tab',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'select_previous_tab'),
			},
			{ type: 'separator' },
			{
				label: 'Toggle Sidebar',
				accelerator: 'CmdOrCtrl+B',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'toggle_sidebar'),
			},
			{
				label: 'Show Project Sidebar',
				accelerator: 'CmdOrCtrl+1',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'sidebar_show_project'),
			},
			{
				label: 'Show Variables Sidebar',
				accelerator: 'CmdOrCtrl+2',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'sidebar_show_variables'),
			},
			{
				label: 'Show Extensions Sidebar',
				accelerator: 'CmdOrCtrl+3',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'sidebar_show_extensions'),
			},
			{ type: 'separator' },
			{
				label: 'Variable Input Lab',
				accelerator: 'CmdOrCtrl+Alt+V',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'show_variable_input_lab'),
			},
			{ type: 'separator' },
			{ role: 'forceReload' },
			{ role: 'toggleDevTools' },
			{ type: 'separator' },
			{ role: 'resetZoom' },
			{ role: 'zoomIn' },
			{ role: 'zoomOut' },
			{ type: 'separator' },
			{
				role: 'togglefullscreen',
				enabled: isProjectEditor(ctx),
			},
		],
	};
}
