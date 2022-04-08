import path from 'path-browserify';

import { ipcFsService } from '../ipc';

export async function renameVariableGroup(oldName: string, newName: string) {
	const oldFilePath = path.join('variable-groups', `${oldName}.json`);
	const newFilePath = path.join('variable-groups', `${newName}.json`);

	if (await ipcFsService.pathExists(newFilePath))
		throw new Error('Variable group already exists');

	await ipcFsService.move(oldFilePath, newFilePath);
}
