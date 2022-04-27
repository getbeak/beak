import { ProjectFile } from '@beak/shared-common/types/beak-project';
import semver from 'semver';

import { readJsonAndValidate } from '../fs';
import { ipcFsService } from '../ipc';
import { projectSchema } from './schemas';

const latestSupported = '0.2.1';

export async function readProjectFile() {
	const { file } = await readJsonAndValidate<ProjectFile>('project.json', projectSchema);

	if (semver.lt(file.version, latestSupported))
		throw new Error('Legacy project detected');

	if (semver.gt(file.version, latestSupported))
		throw new Error('Future project detected');

	await ipcFsService.writeJson('project.json', file);

	return file;
}
