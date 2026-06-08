import { readJsonAndValidate } from '@beak/ui/lib/fs';
import { ipcFsService } from '@beak/ui/lib/ipc';
import type { ProjectFile } from '@getbeak/types/project';
import semver from 'semver';
import { projectSchema } from './schemas';

const latestSupported = '0.5.0';

export async function readProjectFile() {
	const { file } = await readJsonAndValidate<ProjectFile>('project.json', projectSchema);

	if (semver.lt(file.version, latestSupported)) throw new Error('Legacy project detected');

	if (semver.gt(file.version, latestSupported)) throw new Error('Future project detected');

	await ipcFsService.writeJson('project.json', file);

	return file;
}

/**
 * Round-trip project.json to persist a rename. No-ops when the name
 * is already current (avoids unnecessary disk writes on re-dispatch).
 */
export async function persistProjectName(name: string): Promise<void> {
	const projectFile = await readProjectFile();
	if (projectFile.name === name) return;
	await ipcFsService.writeJson('project.json', { ...projectFile, name });
}

/**
 * Round-trip project.json to persist the primary cookie-jar variable set.
 */
export async function persistPrimaryCookieJar(variableSet: string): Promise<void> {
	const projectFile = await readProjectFile();
	if (projectFile.cookies?.primaryVariableSet === variableSet) return;
	await ipcFsService.writeJson('project.json', {
		...projectFile,
		cookies: { ...(projectFile.cookies ?? {}), primaryVariableSet: variableSet },
	});
}
