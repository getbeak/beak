import path from 'node:path';
import ProjectOpener from '@beak/runtime-shared/ports/project-opener';
import { app, type BrowserWindow, dialog, type MessageBoxOptions, type OpenDialogOptions } from 'electron';

import getRuntime from '../host';

export default class ElectronProjectOpener extends ProjectOpener {
	async pickProjectFolder(browserWindow?: BrowserWindow): Promise<string | null> {
		const openDialogOptions: OpenDialogOptions = {
			title: 'Open a Beak project',
			buttonLabel: 'Open',
			properties: ['openFile'],
			filters: [{ name: 'Beak project', extensions: ['json'] }],
		};

		const openDialog = dialog.showOpenDialog;
		const result = await (browserWindow ? openDialog(browserWindow, openDialogOptions) : openDialog(openDialogOptions));

		if (result.canceled) return null;

		if (result.filePaths.length !== 1) {
			const showMessageOptions: MessageBoxOptions = {
				type: 'error',
				title: 'Unable to open project',
				message: 'Please select a single Beak project file.',
			};

			if (browserWindow) await dialog.showMessageBox(browserWindow, showMessageOptions);
			else await dialog.showMessageBox(showMessageOptions);

			return null;
		}

		return result.filePaths[0];
	}

	async openProjectFolder(
		projectPath: string,
		silent = false,
	): Promise<{ id: string; name: string; folder: string; filePath: string } | null> {
		let projectFilePath = projectPath;

		if (!projectFilePath.endsWith('.json')) projectFilePath = path.join(projectFilePath, 'project.json');

		const projectFolderPath = path.parse(projectFilePath).dir;
		const projectFile = await getRuntime().project.readProjectFile(projectFolderPath, {
			runMigrations: true,
		});

		if (!projectFile) {
			if (!silent) {
				await dialog.showMessageBox({
					title: 'Unable to open project',
					message: `The project you tried to open does not exist. Project path provided: ${projectPath}`,
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

		const projectMappings = await getRuntime().providers.storage.get('projectMappings');

		await getRuntime().providers.storage.set('projectMappings', {
			...projectMappings,
			[projectFile.id]: projectFolderPath,
		});
		await getRuntime().project.recents.addProject({
			name: projectFile.name,
			path: projectFolderPath,
		});

		app.addRecentDocument(projectFolderPath);

		return { id: projectFile.id, name: projectFile.name, folder: projectFolderPath, filePath: projectFilePath };
	}
}
