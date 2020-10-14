import createProject from '@beak/common/src/beak-project/create';
import { dialog, ipcMain } from 'electron';

import { closeWindow, createProjectMainWindow, windowStack } from '../window-management';

ipcMain.handle('project_open', (event, args) => {
	const filePath = args as string;

	closeWindow(event.sender.id);
	createProjectMainWindow(filePath);
});

ipcMain.handle('close_window', event => {
	closeWindow(event.sender.id);
});

ipcMain.on('project:create', async (event, args) => {
	const projectName = args as string;
	const window = windowStack[event.sender.id]!;

	const result = await dialog.showOpenDialog(window, {
		title: 'Where do you want to create the new Beak project?',
		buttonLabel: 'Select',
		properties: [
			'openDirectory',
			'createDirectory',
			'promptToCreate',
		],
	});

	if (result.canceled)
		return;

	if (result.filePaths.length !== 1) {
		await dialog.showMessageBox(window, {
			type: 'error',
			title: 'That shouldn\'t happen',
			message: 'You managed to select more than 1 directory... pls don\'t do that.',
		});

		return;
	}

	try {
		const projectFilePath = await createProject({
			name: projectName,
			rootPath: result.filePaths[0],
		});

		closeWindow(event.sender.id);
		createProjectMainWindow(projectFilePath);
	} catch (error) {
		if (error.code === 'project folder already exists') {
			await dialog.showMessageBox(window, {
				type: 'warning',
				title: 'Already exists',
				message: 'A project with that name already exists',
			});
		} else if (error.code === 'project directory not empty') {
			await dialog.showMessageBox(window, {
				type: 'error',
				title: 'Not empty!',
				message: 'That project folder already has files in it',
			});
		} else {
			throw error;
		}
	}
});
