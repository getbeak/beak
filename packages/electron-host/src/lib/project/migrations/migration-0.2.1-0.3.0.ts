/*
	BEAK MIGRATION 0.2.1 -> 0.3.0

	Steps:
	- Create extensions folder
	- Create empty package.json in extensions folder
	- Set version to 0.3.0
*/

import { ProjectFile } from '@getbeak/types/project';
import fs from 'fs-extra';
import path from 'path';

import { createExtensionsPackageJson, createExtensionsReadme } from '..';

export default async function handle(projectFolder: string) {
	const extensionsPath = path.join(projectFolder, 'extensions');
	const projectFilePath = path.join(projectFolder, 'project.json');
	const projectFile = await fs.readJson(projectFilePath) as ProjectFile;

	// Only try and migrate if extensions don't exist... May be left over from beta testers
	if (!await fs.pathExists(extensionsPath)) {
		await fs.ensureDir(extensionsPath);
		await fs.writeJson(path.join(extensionsPath, 'package.json'), createExtensionsPackageJson(projectFile.name), { spaces: '\t' });
		await fs.writeFile(path.join(extensionsPath, 'README.md'), createExtensionsReadme(projectFile.name));
	}

	await fs.writeJson(projectFilePath, {
		...projectFile,
		version: '0.3.0',
	} as ProjectFile);
}
