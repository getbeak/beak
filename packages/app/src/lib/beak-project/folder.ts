import { FolderNode } from '@beak/common/types/beak-project';

import { generateSafeNewPath } from './utils';

const { remote } = window.require('electron');
const path = remote.require('path');
const fs = remote.require('fs-extra');

export async function createFolderNode(directory: string, name?: string) {
	const { fullPath } = await generateSafeNewPath(name || 'New folder', directory);

	await fs.ensureDir(fullPath);

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
	await fs.remove(filePath);
}
