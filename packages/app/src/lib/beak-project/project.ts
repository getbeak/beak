import { ProjectFile } from '@beak/common/types/beak-project';

import { projectSchema } from './schemas';
import { readJsonAndValidate } from './utils';

const { remote } = window.require('electron');
const path = remote.require('path');

export async function readProjectFile(projectPath: string) {
	const projectFilePath = path.join(projectPath, 'project.json');
	const { file } = await readJsonAndValidate<ProjectFile>(projectFilePath, projectSchema);

	if (file.version !== '0.1.0')
		throw new Error('Unsupported project version');

	return file;
}
