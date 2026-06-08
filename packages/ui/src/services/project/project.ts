import type { ProjectFile } from '@getbeak/types/project';
import semver from 'semver';

import { readJsonAndValidate } from '@beak/ui/lib/fs';
import { ipcFsService } from '@beak/ui/lib/ipc';
import { projectSchema } from './schemas';

const latestSupported = '0.5.0';

export async function readProjectFile() {
	const { file } = await readJsonAndValidate<ProjectFile>('project.json', projectSchema);

	if (semver.lt(file.version, latestSupported)) throw new Error('Legacy project detected');

	if (semver.gt(file.version, latestSupported)) throw new Error('Future project detected');

	await ipcFsService.writeJson('project.json', file);

	return file;
}
