import { Nodes } from '@beak/common/types/beak-project';
import path from 'path-browserify';

import { ipcFsService } from '../ipc';

export async function moveNodesOnDisk(sourceNode: Nodes, destinationNode: Nodes) {
	const sourcePath = sourceNode.filePath;
	const sourceName = getSourceNodeName(sourceNode);
	const destinationPath = generateDestinationPath(sourceName, destinationNode);

	// file -> file :: dest->folder->filename
	// file -> dirt :: dest->filename
	// dirt -> file :: dest->filename
	// dirt -> dirt :: dest->foldername

	console.log(sourcePath, sourceName, destinationPath);

	await ipcFsService.move(sourcePath, destinationPath);
}

function getSourceNodeName(node: Nodes) {
	if (node.type === 'folder')
		return path.dirname(node.filePath);

	return path.basename(node.filePath);
}

function generateDestinationPath(sourceName: string, node: Nodes) {
	if (node.type === 'folder')
		return path.join(node.filePath, sourceName);

	const directoryName = path.dirname(node.filePath);

	return path.join(directoryName, sourceName);
}
