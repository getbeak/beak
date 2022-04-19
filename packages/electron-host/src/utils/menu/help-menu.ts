import { latestReleaseNotesUrl } from '@beak/electron-host/updater';
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
			label: 'View release notes',
			click: async () => {
				await shell.openExternal(latestReleaseNotesUrl);
			},
		},
		{ type: 'separator' },
		{
			label: 'Join Slack community',
			click: async () => {
				await shell.openExternal('https://join.slack.com/t/beakapp/shared_invite/zt-17egog9mp-Zy5nAengWuJCdPud3Y1idA');
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
			createUpdateMenuItem(),
			{ role: 'about' },
		];

		(template.submenu as MenuItemConstructorOptions[]).push(...nonDarwinTemplate);
	}

	return template;
}
