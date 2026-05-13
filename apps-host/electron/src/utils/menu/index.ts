import { type Container, windowType } from '@beak/apps-host-electron/window-management';
import { type BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron';

import generateAppMenu from './app-menu';
import generateEditMenu from './edit-menu';
import generateFileMenu from './file-menu';
import generateHelpMenu from './help-menu';
import generateViewMenu from './view-menu';
import generateWindowMenu from './window-menu';

const isDarwin = process.platform === 'darwin';

export type Modifier = (template: MenuItemConstructorOptions[]) => MenuItemConstructorOptions[];

export interface Context {
	browserWindow?: BrowserWindow;
	container?: Container;
	isDarwin: boolean;
}

export function createAndSetMenu(browserWindow?: BrowserWindow) {
	const container = browserWindow ? windowType[browserWindow.id] : undefined;
	const context: Context = {
		browserWindow,
		container,
		isDarwin,
	};

	const template = generateTemplate(context);
	const built = Menu.buildFromTemplate(template);

	Menu.setApplicationMenu(built);
}

function generateTemplate(ctx: Context): MenuItemConstructorOptions[] {
	const template: MenuItemConstructorOptions[] = [];

	if (ctx.isDarwin) template.push(generateAppMenu(ctx));

	template.push(generateFileMenu(ctx));
	template.push(generateEditMenu(ctx));
	template.push(generateViewMenu(ctx));
	template.push(generateWindowMenu(ctx));
	template.push(generateHelpMenu(ctx));

	return template;
}
