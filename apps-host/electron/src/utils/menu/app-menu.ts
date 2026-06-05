import { createPreferencesWindow } from '@beak/apps-host-electron/window-management';
import type { MenuItemConstructorOptions } from 'electron';

import type { Context } from '.';
import { createUpdateMenuItem, isProjectEditor, sendMenuItemClick } from './shared';

export default function generateAppMenu(ctx: Context): MenuItemConstructorOptions {
	return {
		label: 'Beak',
		submenu: [
			{ role: 'about' },
			createUpdateMenuItem(),
			{ type: 'separator' },
			{
				label: 'Preferences...',
				accelerator: 'Cmd+,',
				click: async () => {
					// If a project window is focused, open preferences as a tab there.
					// Otherwise fall back to the standalone preferences window.
					if (isProjectEditor(ctx)) sendMenuItemClick(ctx, 'show_preferences');
					else await createPreferencesWindow();
				},
			},
			{ type: 'separator' },
			{ role: 'services' },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideOthers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' },
		],
	};
}
