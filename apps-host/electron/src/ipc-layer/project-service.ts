import { IpcProjectServiceMain } from '@beak/common/ipc/project';
import Squawk from '@beak/common/utils/squawk';
import { dialog, ipcMain, IpcMainInvokeEvent } from 'electron';

import getBeakHost from '../host';
import { openProjectDialog, tryOpenProjectFolder } from '../host/extensions/project';
import { closeWindow, createProjectMainWindow, tryCloseWelcomeWindow, windowStack } from '../window-management';

const service = new IpcProjectServiceMain(ipcMain);

service.registerOpenFolder(async (_event, projectPath) => {
	tryOpenProjectFolder(projectPath);
});

service.registerOpenProject(async event => {
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;

	await openProjectDialog(window);

	closeWindow((event as IpcMainInvokeEvent).sender.id);
	tryCloseWelcomeWindow();
});

service.registerCreateProject(async (event, payload) => {
	const { projectName } = payload;
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;

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
		const { projectFilePath, projectId } = await getBeakHost().project.create(projectName, result.filePaths[0]);

		closeWindow((event as IpcMainInvokeEvent).sender.id);
		tryCloseWelcomeWindow();

		await createProjectMainWindow(projectId, projectFilePath);
	} catch (error) {
		const sqk = Squawk.coerce(error);

		if (sqk.code === 'project folder already exists') {
			await dialog.showMessageBox(window, {
				type: 'warning',
				title: 'Already exists',
				message: 'A project with that name already exists',
			});
		} else if (sqk.code === 'project directory not empty') {
			await dialog.showMessageBox(window, {
				type: 'error',
				title: 'Not empty!',
				message: 'That project folder already has files in it',
			});
		} else {
			throw sqk;
		}
	}
});
