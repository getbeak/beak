import { Nodes } from '@beak/common/types/beak-project';
import path from 'path-browserify';

import { ipcFsService } from '../ipc';

export async function moveNodesOnDisk(sourceNode: Nodes, destinationNode: Nodes) {
	const sourcePath = sourceNode.filePath;
	const sourceName = getNodeName(sourceNode);
	const destinationPath = generateDestinationPath(sourceName, destinationNode);

	// file -> file :: dest->folder->filename
	// file -> dirt :: dest->filename
	// dirt -> file :: dest->filename
	// dirt -> dirt :: dest->foldername

	if (sourcePath === destinationPath)
		return;

	// TODO(afr): Handle mid-tree changes

	await ipcFsService.move(sourcePath, destinationPath);
}

function generateDestinationPath(sourceName: string, node: Nodes) {
	if (node.type === 'folder')
		return path.join(node.filePath, sourceName);

	const directoryName = path.dirname(node.filePath);

	return path.join(directoryName, sourceName);
}

export function getNodeName(node: Nodes) {
	if (node.type === 'folder')
		return path.dirname(node.filePath);

	return path.basename(node.filePath);
}

export function getNodeDirectory(node: Nodes) {
	if (node.type === 'folder')
		return node.filePath;

	return path.dirname(node.filePath);
}
