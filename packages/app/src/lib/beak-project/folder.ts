import { FolderNode } from '@beak/common/types/beak-project';

const { remote } = window.require('electron');
const path = remote.require('path');

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
