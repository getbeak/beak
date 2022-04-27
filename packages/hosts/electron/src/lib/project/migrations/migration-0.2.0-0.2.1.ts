/*
	BEAK MIGRATION 0.2.0 -> 0.2.1

	Steps:
	- Migrate encryption data storage from `/.beak/supersecret.json` to credential vault
	- Set version to 0.2.1

	Notes:
	- `supersecret.json` must be deleted after
*/

import { ProjectEncryption, ProjectFile } from '@beak/shared-common/types/beak-project';
import fs from 'fs-extra';
import path from 'path';

import { setProjectEncryption } from '../../credential-vault';

interface SupersecretFile {
	encryption: {
		algo: 'aes-256-ctr';
		key: string;
	};
}

export default async function handle(projectFolder: string) {
	const supersecretFile = path.join(projectFolder, '.beak', 'supersecret.json');
	const projectFilePath = path.join(projectFolder, 'project.json');
	const projectFile = await fs.readJson(projectFilePath) as ProjectFile;

	// Only try and migrate if supersecret exists...
	if (await fs.pathExists(supersecretFile)) {
		const ssf = await fs.readJson(supersecretFile, { throws: false }) as SupersecretFile;

		// If it's fucked, then just don't bother
		if (ssf && ssf.encryption && ssf.encryption.algo && ssf.encryption.key) {
			const encryption: ProjectEncryption = {
				algorithm: ssf.encryption.algo,
				key: ssf.encryption.key,
			};

			await setProjectEncryption(projectFile.id, JSON.stringify(encryption));
		}
	}

	await fs.writeJson(projectFilePath, {
		...projectFile,
		version: '0.2.1',
	} as ProjectFile);
	await fs.remove(supersecretFile);
}
