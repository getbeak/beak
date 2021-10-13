import { MenuItemConstructorOptions } from 'electron';

import { Context } from '.';
import { isProjectEditor, sendMenuItemClick } from './shared';

export default function generateEditMenu(ctx: Context): MenuItemConstructorOptions {
	const template: MenuItemConstructorOptions = {
		label: 'Edit',
		submenu: [
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			{ type: 'separator' },
			{
				label: 'Execute Current Request',
				enabled: isProjectEditor(ctx),
				accelerator: 'CmdOrCtrl+Enter',
				click: async () => sendMenuItemClick(ctx, 'execute_request'),
			},
		],
	};

	if (ctx.isDarwin) {
		const darwinMenu: MenuItemConstructorOptions[] = [
			{ role: 'pasteAndMatchStyle' },
			{ role: 'delete' },
			{ role: 'selectAll' },
			{ type: 'separator' },
			{
				label: 'Speech',
				submenu: [
					{ role: 'startSpeaking' },
					{ role: 'stopSpeaking' },
				],
			},
		];

		(template.submenu as MenuItemConstructorOptions[]).push(...darwinMenu);
	} else {
		const nonDarwinMenu: MenuItemConstructorOptions[] = [
			{ role: 'delete' },
			{ type: 'separator' },
			{ role: 'selectAll' },
		];

		(template.submenu as MenuItemConstructorOptions[]).push(...nonDarwinMenu);
	}

	return template;
}
