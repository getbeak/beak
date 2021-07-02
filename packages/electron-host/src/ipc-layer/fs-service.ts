import { IpcFsServiceMain, MoveReq, ReadDirReq, ReadJsonReq, SimplePath, WriteJsonReq } from '@beak/common/ipc/fs';
import Squawk from '@beak/common/utils/squawk';
import { ipcMain } from 'electron';
import fs from 'fs-extra';
import path from 'path';

const service = new IpcFsServiceMain(ipcMain);

service.registerReadJson(async (_event, payload: ReadJsonReq) => {
	await ensureWithinProject(payload.projectFilePath, payload.filePath);

	return await fs.readJson(payload.filePath, payload.options);
});

service.registerWriteJson(async (_event, payload: WriteJsonReq) => {
	await ensureWithinProject(payload.projectFilePath, payload.filePath);

	return await fs.writeJson(payload.filePath, payload.content, payload.options);
});

service.registerPathExists(async (_event, payload: SimplePath) => {
	await ensureWithinProject(payload.projectFilePath, payload.filePath);

	return await fs.pathExists(payload.filePath);
});

service.registerEnsureFile(async (_event, payload: SimplePath) => {
	await ensureWithinProject(payload.projectFilePath, payload.filePath);

	return await fs.ensureFile(payload.filePath);
});

service.registerEnsureDir(async (_event, payload: SimplePath) => {
	await ensureWithinProject(payload.projectFilePath, payload.filePath);

	return await fs.ensureDir(payload.filePath);
});

service.registerRemove(async (_event, payload: SimplePath) => {
	await ensureWithinProject(payload.projectFilePath, payload.filePath);

	return await fs.remove(payload.filePath);
});

service.registerMove(async (_event, payload: MoveReq) => {
	await ensureWithinProject(payload.projectFilePath, payload.srcPath);
	await ensureWithinProject(payload.projectFilePath, payload.dstPath);

	return await fs.move(payload.srcPath, payload.dstPath);
});

service.registerReadDir(async (_event, payload: ReadDirReq) => {
	await ensureWithinProject(payload.projectFilePath, payload.filePath);

	const dirEnts = await fs.readdir(payload.filePath, payload.options || void 0);

	return dirEnts.map(d => ({
		name: d.name,
		isDirectory: d.isDirectory(),
	}));
});

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
	const relative = path.relative(projectDir, inputPath);
	const isWithinProject = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

	if (!isWithinProject)
		throw new Squawk('path_not_within_project', { projectFilePath });
}
