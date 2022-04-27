import { MenuItemConstructorOptions } from 'electron';

import { Context } from '.';

export default function generateWindowMenu(ctx: Context): MenuItemConstructorOptions {
	const template: MenuItemConstructorOptions = {
		label: 'Window',
		submenu: [],
	};

	if (ctx.isDarwin) {
		const darwinTemplate: MenuItemConstructorOptions[] = [
			{ role: 'minimize' },
			{ role: 'zoom' },
			{ type: 'separator' },
			{ role: 'front' },
			{ type: 'separator' },
			{ role: 'window' },
		];

		(template.submenu as MenuItemConstructorOptions[]).push(...darwinTemplate);
	} else {
		const nonDarwinTemplate: MenuItemConstructorOptions[] = [
			{ role: 'minimize' },
			{ role: 'zoom' },
			{ role: 'close' },
		];

		(template.submenu as MenuItemConstructorOptions[]).push(...nonDarwinTemplate);
	}

	return template;
}
