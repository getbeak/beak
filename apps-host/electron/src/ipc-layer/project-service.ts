import path from 'node:path';
import { IpcProjectServiceMain } from '@beak/common/ipc/project';
import Squawk from '@beak/common/utils/squawk';
import { dialog, type IpcMainInvokeEvent, ipcMain } from 'electron';

import getBeakHost from '../host';
import { openProjectDialog, tryOpenProjectFolder } from '../host/extensions/project';
import { closeWindow, createProjectMainWindow, tryCloseWelcomeWindow, windowStack } from '../window-management';
import { getProjectFolder } from './utils';

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
		properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
	});

	if (result.canceled) return;

	if (result.filePaths.length !== 1) {
		await dialog.showMessageBox(window, {
			type: 'error',
			title: "That shouldn't happen",
			message: "You managed to select more than 1 directory... pls don't do that.",
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

service.registerMaterialiseFromMemory(async (event, payload) => {
	const window = windowStack[(event as IpcMainInvokeEvent).sender.id]!;

	const result = await dialog.showOpenDialog(window, {
		title: 'Save this project as…',
		buttonLabel: 'Save here',
		properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
	});

	if (result.canceled || result.filePaths.length !== 1) return null;

	const parentFolder = result.filePaths[0];
	const fs = getBeakHost().providers.node.fs;

	try {
		// Scaffold via the standard create() so encryption keys, .gitignore,
		// .beak/, README, package.json, git init etc. all happen the same way
		// as a brand-new project. We then overwrite the default Request.json
		// + Environment.json with the in-memory tree and variable-sets.
		const { projectFilePath, projectId } = await getBeakHost().project.create(payload.projectName, parentFolder);

		const projectFolder = path.dirname(projectFilePath);
		const treeRoot = path.join(projectFolder, 'tree');
		const variableSetsRoot = path.join(projectFolder, 'variable-sets');

		// Wipe the default scaffolded request — the in-memory tree owns the
		// folder layout from here on. The collection file is left in place so
		// folders without an explicit collection still resolve.
		await fs.promises.rm(path.join(treeRoot, 'Request.json'), { force: true });

		// Folders first (sorted by depth so parents always exist), then requests.
		const folders = Object.values(payload.tree)
			.filter(n => n.type === 'folder')
			.sort((a, b) => a.filePath.split(path.sep).length - b.filePath.split(path.sep).length);
		for (const folder of folders) {
			await fs.promises.mkdir(path.join(projectFolder, folder.filePath), { recursive: true });
		}

		const requests = Object.values(payload.tree).filter(n => n.type === 'request' && n.mode !== 'failed');
		for (const req of requests) {
			if (!req.info) continue;
			const dest = path.join(projectFolder, req.filePath);
			const file = { id: req.id, ...req.info };
			await fs.promises.mkdir(path.dirname(dest), { recursive: true });
			await fs.promises.writeFile(dest, JSON.stringify(file, null, '\t'), 'utf8');
		}

		// Variable sets: blow away the default Environment.json, then write
		// whatever the renderer was holding. Empty variableSets keeps the
		// project usable but with no environments — the user can add via UI.
		await fs.promises.rm(path.join(variableSetsRoot, 'Environment.json'), { force: true });
		for (const [name, set] of Object.entries(payload.variableSets)) {
			const dest = path.join(variableSetsRoot, `${name}.json`);
			await fs.promises.writeFile(dest, JSON.stringify(set, null, '\t'), 'utf8');
		}

		const projectMappings = await getBeakHost().providers.storage.get('projectMappings');
		await getBeakHost().providers.storage.set('projectMappings', {
			...projectMappings,
			[projectId]: projectFolder,
		});

		closeWindow((event as IpcMainInvokeEvent).sender.id);
		await createProjectMainWindow(projectId, projectFilePath);

		return { projectId, projectFilePath };
	} catch (error) {
		const sqk = Squawk.coerce(error);
		await dialog.showMessageBox(window, {
			type: 'error',
			title: 'Could not save project',
			message: sqk.message ?? 'Unexpected error while saving the in-memory project.',
		});
		return null;
	}
});

