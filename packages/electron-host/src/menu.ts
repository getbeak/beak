import { Menu, MenuItemConstructorOptions, shell } from 'electron';
import { autoUpdater } from 'electron-updater';

import { createAboutWindow } from './window-management';

const isMac = process.platform === 'darwin';

function createUpdateMenuItem(): MenuItemConstructorOptions {
	return {
		label: 'Check for Updates',
		click: () => autoUpdater.checkForUpdatesAndNotify(),
	};
}

const macAppMenu: MenuItemConstructorOptions = {
	label: 'Beak',
	submenu: [
		{ role: 'about', click: () => createAboutWindow() },
		createUpdateMenuItem(),
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
	],
};
const nonMacHelp: MenuItemConstructorOptions = {
	role: 'help',
	submenu: [
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
		createUpdateMenuItem(),
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
