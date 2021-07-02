import { FolderNode } from '@beak/common/types/beak-project';
import path from 'path-browserify';

import { ipcFsService } from '../ipc';
import { generateSafeNewPath } from './utils';

export async function createFolderNode(directory: string, name?: string) {
	const { fullPath } = await generateSafeNewPath(name || 'New folder', directory);

	await ipcFsService.ensureDir(fullPath);

	return fullPath;
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
