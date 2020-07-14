import { Menu, MenuItemConstructorOptions, shell } from 'electron';

import { createAboutWindow } from './window-management';

const isMac = process.platform === 'darwin';

const template: MenuItemConstructorOptions[] = [
	// { role: 'appMenu' }
	{
		label: 'Beak',
		submenu: [
			{ role: 'about', click: () => createAboutWindow() },
			{ type: 'separator' },
			{ role: 'services' },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideOthers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' },
		],
	},
	// { role: 'viewMenu' }
	{
		label: 'View',
		submenu: [
			{ role: 'reload' },
			{ role: 'forceReload' },
			{ role: 'toggleDevTools' },
			{ type: 'separator' },
			{ role: 'resetZoom' },
			{ role: 'zoomIn' },
			{ role: 'zoomOut' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' },
		],
	},
	// { role: 'helpMenu' }
	{
		role: 'help',
		submenu: [
			{
				label: 'Learn More',
				click: async () => {
					await shell.openExternal('https://github.com/0xdeafcafe/beak');
				},
			},
		],
	},
];

export default function createMenu() {
	if (!isMac)
		template.shift();

	const menu = Menu.buildFromTemplate(template);

	Menu.setApplicationMenu(menu);
}
