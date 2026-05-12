import { createPreferencesWindow } from '@beak/apps-host-electron/window-management';
import type { MenuItemConstructorOptions } from 'electron';

import type { Context } from '.';
import { createUpdateMenuItem } from './shared';

export default function generateAppMenu(_ctx: Context): MenuItemConstructorOptions {
	return {
		label: 'Beak',
		submenu: [
			{ role: 'about' },
			createUpdateMenuItem(),
			{ type: 'separator' },
			{
				label: 'Preferences...',
				accelerator: 'Cmd+,',
				click: async () => await createPreferencesWindow(),
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
