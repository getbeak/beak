import { ProjectEncryption, ProjectFile } from '@beak/common/types/beak-project';
import fs from 'fs-extra';
import path from 'path';

import { setProjectEncryption } from '../../credential-vault';

interface SupersecretFile {
	encryption: {
		algo: 'aes-256-ctr';
		key: string;
	};
}

export default async function handleSupersecretFile(projectFolder: string) {
	const supersecretFile = path.join(projectFolder, '.beak', 'supersecret.json');
	const projectFilePath = path.join(projectFolder, 'project.json');
	const projectFile = await fs.readJson(projectFilePath) as ProjectFile;

	// Only try and migrate if supersecret exists...
	if (!await fs.pathExists(supersecretFile))
		return;

	const ssf = await fs.readJson(supersecretFile, { throws: false }) as SupersecretFile;

	// If it's fucked, then just don't bother
	if (ssf && ssf.encryption && ssf.encryption.algo && ssf.encryption.key) {
		const encryption: ProjectEncryption = {
			algorithm: ssf.encryption.algo,
			key: ssf.encryption.key,
		};

		await setProjectEncryption(projectFile.id, JSON.stringify(encryption));
	}

	await fs.remove(supersecretFile);
}
