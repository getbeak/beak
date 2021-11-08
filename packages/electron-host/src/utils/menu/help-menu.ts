import { createPreferencesWindow } from '@beak/electron-host/window-management';
import { app, MenuItemConstructorOptions, shell } from 'electron';
import path from 'path';

import { Context } from '.';
import { createUpdateMenuItem } from './shared';

export default function generateHelpMenu(ctx: Context): MenuItemConstructorOptions {
	const template: MenuItemConstructorOptions = {
		label: 'Help',
		submenu: [],
	};

	if (ctx.isDarwin) {
		const darwinTemplate: MenuItemConstructorOptions[] = [{
			label: 'Show logs',
			click: async () => {
				await shell.openPath(path.join(app.getPath('userData'), 'logs', 'main'));
			},
		},
		{
			label: 'Documentation',
			click: async () => {
				await shell.openExternal('https://docs.getbeak.app');
			},
		},
		{
			label: 'Learn More',
			click: async () => {
				await shell.openExternal('https://getbeak.app');
			},
		}];

		(template.submenu as MenuItemConstructorOptions[]).push(...darwinTemplate);
	} else {
		const nonDarwinTemplate: MenuItemConstructorOptions[] = [
			{
				label: 'Show logs',
				click: async () => {
					await shell.openPath(path.join(app.getPath('userData'), 'logs', 'main'));
				},
			},
			{
				label: 'Documentation',
				click: async () => {
					await shell.openExternal('https://docs.getbeak.app');
				},
			},
			{
				label: 'Learn More',
				click: async () => {
					await shell.openExternal('https://getbeak.app');
				},
			},
			{ type: 'separator' },
			{
				label: 'Preferences...',
				click: () => createPreferencesWindow(),
			},
			{ type: 'separator' },
			createUpdateMenuItem(),
			{ role: 'about' },
		];

		(template.submenu as MenuItemConstructorOptions[]).push(...nonDarwinTemplate);
	}

	return template;
}
