import path from 'node:path';
import {
	IpcFsServiceMain,
	type MoveReq,
	type ReadDirReq,
	type ReadJsonReq,
	type ReadTextReq,
	type SimplePath,
	type WriteJsonReq,
	type WriteTextReq,
} from '@beak/common/ipc/fs';
import { BrowserWindow, type IpcMainInvokeEvent, ipcMain, shell } from 'electron';
import fs from 'fs-extra';
import type { JFReadOptions } from 'jsonfile';

import getBeakHost from '../host';
import { openReferenceFile, previewReferencedFile } from '../lib/referenced-files';
import { getProjectFolder } from './utils';

const service = new IpcFsServiceMain(ipcMain);

service.registerReadJson(async (event, payload: ReadJsonReq) => {
	const filePath = await ensureWithinProject(getProjectFolder(event), payload.filePath);

	return await backoffJsonRead(filePath, payload.options);
});

service.registerWriteJson(async (event, payload: WriteJsonReq) => {
	const filePath = await ensureWithinProject(getProjectFolder(event), payload.filePath);

	await ensureParentDirectoryExists(filePath);

	return await fs.writeJson(filePath, payload.content, payload.options as any);
});

service.registerReadText(async (event, payload: ReadTextReq) => {
	const filePath = await ensureWithinProject(getProjectFolder(event), payload.filePath);

	return await fs.readFile(filePath, { encoding: 'utf-8' });
});

service.registerWriteText(async (event, payload: WriteTextReq) => {
	const filePath = await ensureWithinProject(getProjectFolder(event), payload.filePath);

	await ensureParentDirectoryExists(filePath);

	return await fs.writeFile(filePath, payload.content, { encoding: 'utf-8' });
});

service.registerPathExists(async (event, payload: SimplePath) => {
	const filePath = await ensureWithinProject(getProjectFolder(event), payload.filePath);

	return await fs.pathExists(filePath);
});

service.registerEnsureFile(async (event, payload: SimplePath) => {
	const filePath = await ensureWithinProject(getProjectFolder(event), payload.filePath);

	return await fs.ensureFile(filePath);
});

service.registerEnsureDir(async (event, payload: SimplePath) => {
	const filePath = await ensureWithinProject(getProjectFolder(event), payload.filePath);

	return await fs.ensureDir(filePath);
});

service.registerRemove(async (event, payload: SimplePath) => {
	const filePath = await ensureWithinProject(getProjectFolder(event), payload.filePath);

	return await shell.trashItem(filePath);
});

service.registerMove(async (event, payload: MoveReq) => {
	const srcPath = await ensureWithinProject(getProjectFolder(event), payload.srcPath);
	const dstPath = await ensureWithinProject(getProjectFolder(event), payload.dstPath);

	return await fs.move(srcPath, dstPath);
});

service.registerReadDir(async (event, payload: ReadDirReq) => {
	const filePath = await ensureWithinProject(getProjectFolder(event), payload.filePath);
	const directoryEntries = await fs.readdir(filePath, payload.options || void 0);

	return directoryEntries.map(d => ({
		name: d.name,
		isDirectory: d.isDirectory(),
	}));
});

service.registerOpenReferenceFile(async event => {
	const sender = (event as IpcMainInvokeEvent).sender;
	// biome-ignore lint/style/noNonNullAssertion: a live IPC sender always has a window
	const window = BrowserWindow.fromWebContents(sender)!;

	return await openReferenceFile(window);
});

service.registerPreviewReferencedFile(async (event, payload) => {
	const sender = (event as IpcMainInvokeEvent).sender;
	// biome-ignore lint/style/noNonNullAssertion: a live IPC sender always has a window
	const window = BrowserWindow.fromWebContents(sender)!;
	const filePath = await previewReferencedFile(window, payload.fileReferenceId);

	if (!filePath) return null;
	if (!(await fs.pathExists(filePath))) return null;

	const stat = await fs.stat(filePath);

	return {
		filePath,
		fileName: path.basename(filePath),
		fileExtension: path.extname(filePath),
		fileSize: stat.size,
	};
});

service.registerReadReferencedFile(async (event, payload) => {
	const sender = (event as IpcMainInvokeEvent).sender;
	// biome-ignore lint/style/noNonNullAssertion: a live IPC sender always has a window
	const window = BrowserWindow.fromWebContents(sender)!;
	const filePath = await previewReferencedFile(window, payload.fileReferenceId);

	const file = await fs.readFile(filePath);

	if (payload.truncatedLength !== void 0) return { body: file.slice(0, payload.truncatedLength) };

	return { body: file };
});

async function ensureParentDirectoryExists(filePath: string) {
	const parentDirectory = path.join(filePath, '..');

	await fs.ensureDir(parentDirectory);
}

// This is needed as a json file read may happen while the file is being stream-written
async function backoffJsonRead(filePath: string, options?: JFReadOptions) {
	let latestError: unknown = null;

	for (let i = 0; i < 3; i++) {
		try {
			return await fs.readJson(filePath, options);
		} catch (error) {
			latestError = error;

			await new Promise(resolve => setTimeout(resolve, 50));
		}
	}

	throw latestError;
}

/**
 * Thin proxy into the unified `Runtime.fs.ensureWithinProject` — both
 * hosts share one safety surface. Signature now takes the project
 * folder (matching web's pre-existing shape and the runtime helper's);
 * callers that previously passed `getProjectFilePathWindowMapping(event)`
 * (the `.../project.json` file path) should now pass `getProjectFolder(event)`.
 */
export async function ensureWithinProject(projectFolderPath: string, inputPath: string) {
	return getBeakHost().fs.ensureWithinProject(projectFolderPath, inputPath);
}
