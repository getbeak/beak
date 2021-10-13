import { createPreferencesWindow } from '@beak/electron-host/window-management';
import { MenuItemConstructorOptions, shell } from 'electron';

import { Context } from '.';
import { createUpdateMenuItem } from './shared';

export default function generateHelpMenu(ctx: Context): MenuItemConstructorOptions {
	const template: MenuItemConstructorOptions = {
		label: 'Help',
		submenu: [],
	};

	if (ctx.isDarwin) {
		const darwinTemplate: MenuItemConstructorOptions[] = [{
			label: 'Feedback',
			click: async () => {
				await shell.openExternal('https://www.notion.so/beakapp/8e3f72a1103548c7a149de1485effda9?v=33ae478ec0524a57bc2a9ae0421ed63a');
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
				label: 'Feedback',
				click: async () => {
					await shell.openExternal('https://www.notion.so/beakapp/8e3f72a1103548c7a149de1485effda9?v=33ae478ec0524a57bc2a9ae0421ed63a');
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
