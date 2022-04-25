import {
	IpcFsServiceMain,
	MoveReq,
	ReadDirReq,
	ReadJsonReq,
	ReadTextReq,
	SimplePath,
	WriteJsonReq,
	WriteTextReq,
} from '@beak/common/ipc/fs';
import Squawk from '@beak/common/utils/squawk';
import { ipcMain, shell } from 'electron';
import fs from 'fs-extra';
import path from 'path';

import { getProjectWindowMapping } from './fs-shared';

const service = new IpcFsServiceMain(ipcMain);

service.registerReadJson(async (event, payload: ReadJsonReq) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);

	return await backoffJsonRead(filePath, payload.options);
});

service.registerWriteJson(async (event, payload: WriteJsonReq) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);

	await ensureParentDirectoryExists(filePath);

	return await fs.writeJson(filePath, payload.content, payload.options);
});

service.registerReadText(async (event, payload: ReadTextReq) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);

	return await fs.readFile(filePath, { encoding: 'utf-8' });
});

service.registerWriteText(async (event, payload: WriteTextReq) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);

	await ensureParentDirectoryExists(filePath);

	return await fs.writeFile(filePath, payload.content, { encoding: 'utf-8' });
});

service.registerPathExists(async (event, payload: SimplePath) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);

	return await fs.pathExists(filePath);
});

service.registerEnsureFile(async (event, payload: SimplePath) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);

	return await fs.ensureFile(filePath);
});

service.registerEnsureDir(async (event, payload: SimplePath) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);

	return await fs.ensureDir(filePath);
});

service.registerRemove(async (event, payload: SimplePath) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);

	return await shell.trashItem(filePath);
});

service.registerMove(async (event, payload: MoveReq) => {
	const srcPath = await ensureWithinProject(getProjectWindowMapping(event), payload.srcPath);
	const dstPath = await ensureWithinProject(getProjectWindowMapping(event), payload.dstPath);

	return await fs.move(srcPath, dstPath);
});

service.registerReadDir(async (event, payload: ReadDirReq) => {
	const filePath = await ensureWithinProject(getProjectWindowMapping(event), payload.filePath);
	const directoryEntries = await fs.readdir(filePath, payload.options || void 0);

	return directoryEntries.map(d => ({
		name: d.name,
		isDirectory: d.isDirectory(),
	}));
});

async function ensureParentDirectoryExists(filePath: string) {
	const parentDirectory = path.join(filePath, '..');

	await fs.ensureDir(parentDirectory);
}

// This is needed as a json file read may happen while the file is being stream-written
async function backoffJsonRead(filePath: string, options?: fs.ReadOptions) {
	let latestError: unknown = null;

	/* eslint-disable no-await-in-loop */
	for (let i = 0; i < 3; i++) {
		try {
			return await fs.readJson(filePath, options);
		} catch (error) {
			latestError = error;

			await new Promise(resolve => window.setTimeout(resolve, 50));
		}
	}
	/* eslint-enable no-await-in-loop */

	throw latestError;
}

export async function ensureWithinProject(projectFilePath: string, inputPath: string) {
	const exists = fs.pathExists(projectFilePath);

	if (!exists)
		throw new Squawk('path_not_project', { projectFilePath });

	const project = await fs.readJson(projectFilePath);

	if (typeof project !== 'object')
		throw new Squawk('path_project_corrupt', { projectFilePath });

	if (!project.id || !project.version || !project.name)
		throw new Squawk('path_project_invalid', { projectFilePath });

	const projectDir = path.join(projectFilePath, '..');
	const resolved = path.resolve(path.join(projectDir, inputPath));
	const isWithinProject = resolved.startsWith(projectDir) && path.isAbsolute(resolved);

	if (!isWithinProject)
		throw new Squawk('path_not_within_project', { projectFilePath });

	return resolved;
}
