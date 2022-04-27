import { createPreferencesWindow } from '@beak/host-electron/window-management';
import { MenuItemConstructorOptions } from 'electron';

import { Context } from '.';
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
				click: () => createPreferencesWindow(),
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
