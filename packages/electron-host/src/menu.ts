import { Menu, MenuItemConstructorOptions, shell } from 'electron';
import { autoUpdater } from 'electron-updater';

import { createAboutWindow } from './window-management';

const isMac = process.platform === 'darwin';

const macAppMenu: MenuItemConstructorOptions = {
	label: 'Beak',
	submenu: [
		{ role: 'about', click: () => createAboutWindow() },
		{ label: 'Check for updates...', click: () => autoUpdater.checkForUpdatesAndNotify() },
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

const macWindow: MenuItemConstructorOptions = {
	label: 'Window',
	submenu: [
		{ role: 'minimize' },
		{ role: 'zoom' },
		{ type: 'separator' },
		{ role: 'front' },
		{ type: 'separator' },
		{ role: 'window' },
	],
};
const nonMacWindow: MenuItemConstructorOptions = {
	label: 'Window',
	submenu: [
		{ role: 'minimize' },
		{ role: 'zoom' },
		{ role: 'close' },
	],
};

const macHelp: MenuItemConstructorOptions = {
	role: 'help',
	submenu: [
		{
			label: 'Learn More',
			click: async () => {
				await shell.openExternal('https://github.com/beak-app/beak');
			},
		},
	],
};
const nonMacHelp: MenuItemConstructorOptions = {
	role: 'help',
	submenu: [
		{
			label: 'Learn More',
			click: async () => {
				await shell.openExternal('https://github.com/beak-app/beak');
			},
		},
		{ label: 'Check for updates...', click: () => autoUpdater.checkForUpdatesAndNotify() },
		{ role: 'about', click: () => createAboutWindow() },
	],
};

function getEditExtras(): MenuItemConstructorOptions[] {
	if (isMac) {
		return [
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
	}

	return [
		{ role: 'delete' },
		{ type: 'separator' },
		{ role: 'selectAll' },
	];
}

function createTemplate() {
	const template: MenuItemConstructorOptions[] = [];

	if (isMac)
		template.push(macAppMenu);

	// { role: 'fileMenu' }
	template.push({
		label: 'File',
		submenu: [
			isMac ? { role: 'close' } : { role: 'quit' },
		],
	});

	// { role: 'editMenu' }
	template.push({
		label: 'Edit',
		submenu: [
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			...getEditExtras(),
		],
	});

	// { role: 'viewMenu' }
	template.push({
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
	});

	// { role: 'windowMenu' }
	template.push(isMac ? macWindow : nonMacWindow);

	// { role: 'helpMenu' }
	template.push(isMac ? macHelp : nonMacHelp);

	return template;
}

export default function createMenu() {
	const template = createTemplate();
	const menu = Menu.buildFromTemplate(template);

	Menu.setApplicationMenu(menu);
}
