import { latestReleaseNotesUrl } from '@beak/apps-host-electron/updater';
import { app, MenuItemConstructorOptions, shell } from 'electron';
import path from 'path';

import { Context } from '.';
import { createUpdateMenuItem, sendMenuItemClick } from './shared';

export default function generateHelpMenu(ctx: Context): MenuItemConstructorOptions {
	const template: MenuItemConstructorOptions = {
		label: 'Help',
		submenu: [{
			label: 'Get started',
			enabled: ctx.container === 'project-main',
			click: async () => sendMenuItemClick(ctx, 'show_new_project_intro'),
		}, {
			label: 'Show all commands',
			enabled: ctx.container === 'project-main',
			accelerator: 'CmdOrCtrl+Shift+P',
			click: async () => sendMenuItemClick(ctx, 'show_omni_commands'),
		}, {
			label: 'Show Beak manual',
			click: async () => shell.openExternal('https://docs.getbeak.app'),
		}, {
			label: 'Release notes',
			click: async () => shell.openExternal(latestReleaseNotesUrl),
		}, { type: 'separator' }, {
			label: 'Show application logs',
			click: async () => {
				await shell.openPath(path.join(app.getPath('userData'), 'logs', 'main'));
			},
		}, {
			label: 'Show extension logs',
			click: async () => {
				await shell.openPath(path.join(app.getPath('userData'), 'logs', 'extensions'));
			},
		}, { type: 'separator' }, {
			label: 'Join Slack community',
			click: async () => {
				await shell.openExternal('https://join.slack.com/t/beakapp/shared_invite/zt-17egog9mp-Zy5nAengWuJCdPud3Y1idA');
			},
		}, {
			label: 'Join us on Twitter',
			click: async () => {
				await shell.openExternal('https://twitter.com/beakapp');
			},
		}, {
			label: 'Report issue',
			click: async () => {
				await shell.openExternal('mailto:support@getbeak.app');
			},
		}, { type: 'separator' }, {
			label: 'View terms',
			click: async () => {
				await shell.openExternal('https://getbeak.app/legal/terms');
			},
		}, {
			label: 'View privacy statement',
			click: async () => {
				await shell.openExternal('https://getbeak.app/legal/privacy');
			},
		}, {
			label: 'View climate contribution',
			click: async () => {
				await shell.openExternal('https://climate.stripe.com/x4snkJ');
			},
		}],
	};

	if (!ctx.isDarwin) {
		const nonDarwinTemplate: MenuItemConstructorOptions[] = [
			{ type: 'separator' },
			createUpdateMenuItem(),
			{ role: 'about' },
		];

		(template.submenu as MenuItemConstructorOptions[]).push(...nonDarwinTemplate);
	}

	return template;
}
