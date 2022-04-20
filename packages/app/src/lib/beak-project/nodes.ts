import { Nodes } from '@beak/common/types/beak-project';
import path from 'path-browserify';

import { ipcDialogService, ipcFsService } from '../ipc';

export async function moveNodesOnDisk(sourceNode: Nodes, destinationNode: Nodes | null) {
	const sourcePath = sourceNode.filePath;
	const sourceBasename = path.basename(sourcePath);
	const destinationPath = path.join(getDestinationFolder(destinationNode), sourceBasename);

	if (sourcePath === destinationPath)
		return;

	if (await ipcFsService.pathExists(destinationPath)) {
		const { response } = await ipcDialogService.showMessageBox({
			type: 'warning',
			title: 'Unable to move file or folder',
			message: `A file or folder with the name '${sourceBasename}' already exists in the destination folder. Do you want to replace it?`,
			detail: 'This action is irreversible inside Beak!',
			buttons: ['Replace', 'Cancel'],
			defaultId: 0,
		});

		if (response === 1)
			return;
	}

	await ipcFsService.move(sourcePath, destinationPath);
}

export function getDestinationFolder(node: Nodes | null) {
	// Workaround for the root!
	if (!node)
		return 'tree';

	if (node.type === 'folder')
		return node.filePath;
	
	return node.parent!;
}

export function getNodeName(node: Nodes) {

	return path.basename(node.filePath);
}

export function getNodeDirectory(node: Nodes) {
	if (node.type === 'folder')
		return node.filePath;

	return path.dirname(node.filePath);
}
