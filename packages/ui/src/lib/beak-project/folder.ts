import type { FolderNode } from '@getbeak/types/nodes';
import path from 'path-browserify';

import { ipcFsService } from '../ipc';
import { generateSafeNewPath } from './utils';

export async function createFolderNode(directory: string, name?: string) {
	const { fullPath } = await generateSafeNewPath(name || 'New folder', directory);

	await ipcFsService.ensureDir(fullPath);

	return fullPath;
}

export async function renameFolderNode(newName: string, folderNode: FolderNode) {
	const directory = path.dirname(folderNode.filePath);
	const newFilePath = path.join(directory, newName);
	const oldFilePath = folderNode.filePath;

	if (await ipcFsService.pathExists(newFilePath))
		throw new Error('Folder already exists');

	await ipcFsService.move(oldFilePath, newFilePath);
}

export async function readFolderNode(filePath: string) {
	const node: FolderNode = {
		type: 'folder',
		id: filePath,
		filePath,
		name: path.basename(filePath),
		parent: path.join(filePath, '..'),
	};

	return node;
}

export async function removeFolderNode(filePath: string) {
	await ipcFsService.remove(filePath);
}
