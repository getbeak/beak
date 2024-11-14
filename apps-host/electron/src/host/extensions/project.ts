import { createProjectMainWindow } from '@beak/apps-host-electron/window-management';
import {
	app,
	BrowserWindow,
	dialog,
	MessageBoxOptions,
	OpenDialogOptions,
} from 'electron';
import path from 'node:path';

import getBeakHost from '..';

export async function tryOpenProjectFolder(projectPath: string, silent = false) {
	let projectFilePath = projectPath;
	if (!projectFilePath.endsWith('.json')) {
		projectFilePath = path.join(projectFilePath, 'project.json');
	}

	const projectFolderPath = path.parse(projectFilePath).dir;
	const projectFile = await getBeakHost().project.readProjectFile(projectFolderPath, {
		runMigrations: true,
	});

	if (!projectFile) {
		if (!silent) {
			await dialog.showMessageBox({
				title: 'Unable to open project',
				message: 'The project you tried to open does not exist. Project path provided: ' + projectPath,
				type: 'error',
			});
		}

		return null;
	}

	if (!projectFile.name) {
		if (!silent) {
			await dialog.showMessageBox({
				title: 'Unable to open project',
				message: 'The selected project does not look like a Beak project file. Please try again.',
				type: 'error',
			});
		}

		return null;
	}

	const projectMappings = await getBeakHost().providers.storage.get('projectMappings');

	await getBeakHost().providers.storage.set('projectMappings', {
		...projectMappings,
		[projectFile.id]: projectFolderPath,
	});
	await getBeakHost().project.recents.addProject({
		name: projectFile.name,
		path: projectFolderPath,
	});

	app.addRecentDocument(projectFolderPath);

	return await createProjectMainWindow(projectFile.id, projectFilePath);
}

export async function openProjectDialog(browserWindow?: BrowserWindow) {
	const openDialogOptions: OpenDialogOptions = {
		title: 'Open a Beak project',
		buttonLabel: 'Open',
		properties: ['openFile'],
		filters: [
			{ name: 'Beak project', extensions: ['json'] },
		],
	};

	const openDialog = dialog.showOpenDialog;
	const result = await (browserWindow ? openDialog(browserWindow, openDialogOptions) : openDialog(openDialogOptions));

	if (result.canceled)
		return;

	if (result.filePaths.length !== 1) {
		const showMessageOptions: MessageBoxOptions = {
			type: 'error',
			title: 'That shouldn\'t happen',
			message: 'You managed to select more than 1 file... pls don\'t do that.',
		};

		if (browserWindow)
			await dialog.showMessageBox(browserWindow, showMessageOptions);
		else
			await dialog.showMessageBox(showMessageOptions);

		return;
	}

	await tryOpenProjectFolder(result.filePaths[0]);
}
