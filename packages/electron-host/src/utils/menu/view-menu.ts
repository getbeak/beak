import { MenuItemConstructorOptions } from 'electron';

import { Context } from '.';
import { isProjectEditor, sendMenuItemClick } from './shared';

export default function generateViewMenu(ctx: Context): MenuItemConstructorOptions {
	return {
		label: 'View',
		submenu: [
			{ type: 'separator' }, {
				label: 'Close Tab',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'close_tab'),
			}, {
				label: 'Close All Tabs',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'close_all_tabs'),
			}, {
				label: 'Close Other Tabs',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'close_other_tabs'),
			}, {
				label: 'Select Next Tab',
				accelerator: 'Ctrl+Tab',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'select_next_tab'),
			}, {
				label: 'Select Previous Tab',
				accelerator: 'Ctrl+Shift+Tab',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'select_previous_tab'),
			},
			{ type: 'separator' }, {
				label: 'Toggle Sidebar',
				accelerator: 'CmdOrCtrl+B',
				enabled: isProjectEditor(ctx),
				click: async () => sendMenuItemClick(ctx, 'toggle_sidebar'),
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
