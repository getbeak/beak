import type { ProjectEncryption } from '@beak/common/types/beak-project';
import { BeakBase } from '@beak/runtime-shared/base';
import { fileExists } from '@beak/runtime-shared/utils/fs';
import type { ProjectFile } from '@getbeak/types/project';

interface SupersecretFile {
	encryption: {
		algo: 'aes-256-ctr';
		key: string;
	};
}

/*
	This sounds pretty stupid, but bare with me. Standard migrations happen once,
	and then are reflected in visible files, so other team members don't need to worry.

	However some migrations change "silent" files, which needs to happen everywhere,
	otherwise the project will fail to open.

	𝓼𝓲𝓵𝓮𝓷𝓽 𝓶𝓲𝓰𝓻𝓪𝓽𝓲𝓸𝓷𝓼
*/

export default class BeakSilentMigrations extends BeakBase {
	async runMigrations(projectFile: ProjectFile, projectFolderPath: string) {
		await this.handleSupersecretFile(projectFile, projectFolderPath);
	}

	private async handleSupersecretFile(projectFile: ProjectFile, projectFolderPath: string) {
		const supersecretFilePath = this.p.node.path.join(projectFolderPath, '.beak', 'supersecret.json');

		// Only try and migrate if supersecret exists...
		if (!(await fileExists(this, supersecretFilePath))) return;

		try {
			const ssfContent = await this.p.node.fs.promises.readFile(supersecretFilePath, 'utf8');
			const ssf = JSON.parse(ssfContent) as SupersecretFile;

			if (ssf && ssf.encryption && ssf.encryption.algo && ssf.encryption.key) {
				const encryption: ProjectEncryption = {
					algorithm: ssf.encryption.algo,
					key: ssf.encryption.key,
				};

				await this.p.credentials.setProjectEncryption(projectFile.id, encryption);
			}
		} finally {
			await this.p.node.fs.promises.rm(supersecretFilePath, { force: true });
		}
	}
}
