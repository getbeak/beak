import { ProjectFile } from '@beak/common/types/beak-project';

import { readJsonAndValidate } from '../fs';
import { ipcFsService } from '../ipc';
import { projectSchema } from './schemas';

export async function readProjectFile() {
	const { file } = await readJsonAndValidate<ProjectFile>('project.json', projectSchema);

	if (file.version !== '0.2.0')
		throw new Error('Unsupported project version');

	// Fire and forget writing the file. This is a hack to handle recently opened projects
	// on the Beak welcome screen.
	ipcFsService.writeJson('project.json', file);

	return file;
}
