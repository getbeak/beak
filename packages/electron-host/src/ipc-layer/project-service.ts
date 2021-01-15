import { IpcProjectServiceMain } from '@beak/common/ipc/project';
import { ProjectFile } from '@beak/common/types/beak-project';
import { dialog, ipcMain } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';

import { addRecentProject } from '../lib/beak-hub';
import createProject from '../lib/beak-project';
import { closeWindow, createProjectMainWindow, windowStack } from '../window-management';

const service = new IpcProjectServiceMain(ipcMain);

service.registerOpenFolder(async (event, projectPath) => {
	const projectFilePath = path.join(projectPath, 'project.json');
	const projectFile = await fs.readJson(projectFilePath) as ProjectFile;

	await addRecentProject({
		name: projectFile.name,
		path: projectPath,
		type: 'local',
	});

	closeWindow(event.sender.id);
	createProjectMainWindow(projectFilePath);
});

service.registerOpenProject(async event => {
	const window = windowStack[event.sender.id]!;
	const result = await dialog.showOpenDialog(window, {
		title: 'Open a Beak project',
		buttonLabel: 'Open',
		properties: ['openFile'],
		filters: [
			{ name: 'Beak project', extensions: ['json'] },
			{ name: 'All files', extensions: ['*'] },
		],
	});

	if (result.canceled)
		return;

	if (result.filePaths.length !== 1) {
		await dialog.showMessageBox(window, {
			type: 'error',
			title: 'That shouldn\'t happen',
			message: 'You managed to select more than 1 file... pls don\'t do that.',
		});

		return;
	}

	const projectFilePath = result.filePaths[0];
	const projectFile = await fs.readJson(projectFilePath) as ProjectFile;
	const projectPath = path.join(projectFilePath, '..');

	await addRecentProject({
		name: projectFile.name,
		path: projectPath,
		type: 'local',
	});

	closeWindow(event.sender.id);
	createProjectMainWindow(projectFilePath);
});

service.registerCreateProject(async (event, payload) => {
	const { projectName } = payload;
	const window = windowStack[event.sender.id]!;

	const result = await dialog.showOpenDialog(window, {
		title: 'Where do you want to create your new Beak project?',
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
