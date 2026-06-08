import { ipcDialogService, ipcFsService } from '@beak/ui/lib/ipc';
import type { Nodes } from '@getbeak/types/nodes';
import path from 'path-browserify';

export async function moveNodesOnDisk(sourceNode: Nodes, destinationNode: Nodes | null) {
	const sourcePath = sourceNode.filePath;
	const sourceBasename = path.basename(sourcePath);
	const destinationPath = path.join(getDestinationFolder(destinationNode), sourceBasename);

	if (sourcePath === destinationPath) return;

	if (await ipcFsService.pathExists(destinationPath)) {
		const { response } = await ipcDialogService.showMessageBox({
			type: 'warning',
			title: `Replace ${sourceBasename}?`,
			message: `A file or folder with the name “${sourceBasename}” already exists in the destination folder. Do you want to replace it?`,
			detail: 'This action is irreversible inside Beak!',
			buttons: ['Replace', 'Cancel'],
			defaultId: 1,
			cancelId: 1,
		});

		if (response === 1) return;
	}

	await ipcFsService.move(sourcePath, destinationPath);
}

export function getDestinationFolder(node: Nodes | null) {
	// Workaround for the root!
	if (!node) return 'tree';

	if (node.type === 'folder') return node.filePath;

	return node.parent!;
}
