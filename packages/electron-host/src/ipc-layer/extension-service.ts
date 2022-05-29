import { IpcExtensionsServiceMain } from '@beak/common/ipc/extensions';
import Squawk from '@beak/common/utils/squawk';
import { ipcMain } from 'electron';

import ExtensionManager from '../lib/extension';
import { readProjectFile } from '../lib/project';
import { ensureWithinProject } from './fs-service';
import { getProjectWindowMapping } from './fs-shared';
import { getProjectFolder } from './utils';

const service = new IpcExtensionsServiceMain(ipcMain);
const extensionManager = new ExtensionManager();

service.registerRegisterRtv(async (event, payload) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.extensionFilePath);
	const projectFolderPath = getProjectFolder(event);
	const projectFile = await readProjectFile(projectFolderPath);

	if (!projectFile || !projectFile.id)
		throw new Squawk('invalid_project_file', { projectFile });

	return await extensionManager.registerRtv(event, projectFile.id, filePath);
});

service.registerRtvCreateDefaultPayload(async (event, payload) => {
	const projectFolderPath = getProjectFolder(event);
	const projectFile = await readProjectFile(projectFolderPath);

	if (!projectFile || !projectFile.id)
		throw new Squawk('invalid_project_file', { projectFile });

	return await extensionManager.rtvCreateDefaultPayload(projectFile.id, payload.type, payload.context);
});

service.registerRtvGetValuePayload(async (event, payload) => {
	const projectFolderPath = getProjectFolder(event);
	const projectFile = await readProjectFile(projectFolderPath);

	if (!projectFile || !projectFile.id)
		throw new Squawk('invalid_project_file', { projectFile });

	return await extensionManager.rtvGetValue(
		projectFile.id,
		payload.type,
		payload.context,
		payload.payload,
		payload.recursiveSet,
	);
});

service.registerRtvEditorCreateUserInterface(async (event, payload) => {
	const projectFolderPath = getProjectFolder(event);
	const projectFile = await readProjectFile(projectFolderPath);

	if (!projectFile || !projectFile.id)
		throw new Squawk('invalid_project_file', { projectFile });

	return await extensionManager.rtvCreateUserInterface(
		projectFile.id,
		payload.type,
		payload.context,
	);
});

service.registerRtvEditorLoad(async (event, payload) => {
	const projectFolderPath = getProjectFolder(event);
	const projectFile = await readProjectFile(projectFolderPath);

	if (!projectFile || !projectFile.id)
		throw new Squawk('invalid_project_file', { projectFile });

	return await extensionManager.rtvEditorLoad(
		projectFile.id,
		payload.type,
		payload.context,
		payload.payload,
	);
});

service.registerRtvEditorSave(async (event, payload) => {
	const projectFolderPath = getProjectFolder(event);
	const projectFile = await readProjectFile(projectFolderPath);

	if (!projectFile || !projectFile.id)
		throw new Squawk('invalid_project_file', { projectFile });

	return await extensionManager.rtvEditorSave(
		projectFile.id,
		payload.type,
		payload.context,
		payload.existingPayload,
		payload.state,
	);
});
